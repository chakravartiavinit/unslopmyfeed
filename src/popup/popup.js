// Initialize Supabase client
const SUPABASE_URL = 'https://vfhibolzkryzcwjswvle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaGlib2x6a3J5emN3anN3dmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDAzNDksImV4cCI6MjA4NjIxNjM0OX0.ThkFOVRqBDbwUMX5mVZbHqlyJc3iKxMQ_6gnJ_BeBnI';

let supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabase) {
        console.error('Supabase not found');
        return;
    }

    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
        }
    });

    initApp();
});

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.style.display = 'flex';
}

async function initApp() {
    showScreen('loading');

    // Check if we have a session in local storage
    const { supabaseSession } = await chrome.storage.local.get(['supabaseSession']);

    if (supabaseSession) {
        // Verify session is still valid
        const { data: { user }, error } = await supabaseClient.auth.getUser(supabaseSession.access_token);
        if (user && !error) {
            setupDashboard(user, supabaseSession);
            return;
        }
    }

    // Not authenticated
    showScreen('auth');
    setupAuthListeners();
}

function setupAuthListeners() {
    const signInBtn = document.getElementById('google-sign-in');
    if (signInBtn) {
        signInBtn.onclick = handleSignIn;
    }
}

async function handleSignIn() {
    const loadingStatus = document.getElementById('loading-status');
    if (loadingStatus) loadingStatus.innerText = 'Signing you in...';
    showScreen('loading');

    try {
        const redirectUrl = chrome.identity.getRedirectURL();
        console.log('Redirect URL:', redirectUrl);

        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });

        if (error) throw error;

        // Perform the OAuth flow
        const authUrl = data.url;
        chrome.identity.launchWebAuthFlow({
            url: authUrl,
            interactive: true
        }, async (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                console.error('Auth flow failed:', chrome.runtime.lastError);
                showScreen('auth');
                return;
            }

            // Parse tokens from URL fragment
            const url = new URL(responseUrl);
            const params = new URLSearchParams(url.hash.substring(1));
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
                const { data: { session }, error: sessionError } = await supabaseClient.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (sessionError) throw sessionError;

                // Store session
                await chrome.storage.local.set({
                    supabaseSession: session,
                    isAuthenticated: true
                });

                setupDashboard(session.user, session);
            } else {
                throw new Error('No tokens found in response');
            }
        });

    } catch (err) {
        console.error('Sign in error:', err);
        showScreen('auth');
        alert('Failed to sign in. Please try again.');
    }
}

async function setupDashboard(user, session) {
    showScreen('dashboard');

    // Header & Profile setup
    const profileToggle = document.getElementById('profile-toggle');
    const profilePanel = document.getElementById('profile-panel');
    const avatar = document.getElementById('user-avatar');
    const name = document.getElementById('user-name');
    const email = document.getElementById('user-email');
    const signOutBtn = document.getElementById('sign-out-btn');

    const fullName = user.user_metadata?.full_name || 'User';
    name.textContent = fullName;
    email.textContent = user.email;
    avatar.textContent = fullName.charAt(0).toUpperCase();

    profileToggle.onclick = () => {
        profilePanel.style.display = profilePanel.style.display === 'none' ? 'flex' : 'none';
    };

    signOutBtn.onclick = handleSignOut;

    // Filters and Stats setup
    const filters = ['flex', 'crypto', 'engagement', 'distractions'];
    const { filters: savedFilters, filteredCount, allTimeFiltered } = await chrome.storage.local.get(['filters', 'filteredCount', 'allTimeFiltered']);

    const currentFilters = savedFilters || { flex: true, crypto: true, engagement: true, distractions: true };
    document.getElementById('filtered-count').textContent = filteredCount || 0;
    document.getElementById('session-filtered').textContent = filteredCount || 0;
    document.getElementById('alltime-filtered').textContent = allTimeFiltered || 0;

    filters.forEach(id => {
        const el = document.getElementById(`filter-${id}`);
        if (el) {
            el.checked = currentFilters[id];
            el.onchange = async () => {
                const newFilters = {};
                filters.forEach(fid => {
                    newFilters[fid] = document.getElementById(`filter-${fid}`).checked;
                });
                await chrome.storage.local.set({ filters: newFilters });
                notifyContentScript({ type: 'SETTINGS_CHANGED', settings: newFilters });
            };
        }
    });

    const cleanBtn = document.getElementById('clean-btn');
    cleanBtn.onclick = () => {
        notifyContentScript({ type: 'TRIGGER_CLEAN' });
        const originalText = cleanBtn.textContent;
        cleanBtn.textContent = 'Cleaning...';
        setTimeout(() => cleanBtn.textContent = originalText, 1500);
    };

    // Auto-update stats
    setInterval(async () => {
        const { filteredCount: fc, allTimeFiltered: af } = await chrome.storage.local.get(['filteredCount', 'allTimeFiltered']);
        document.getElementById('filtered-count').textContent = fc || 0;
        document.getElementById('session-filtered').textContent = fc || 0;
        document.getElementById('alltime-filtered').textContent = af || 0;
    }, 2000);
}

async function handleSignOut() {
    await supabaseClient.auth.signOut();
    await chrome.storage.local.remove(['supabaseSession', 'isAuthenticated', 'filteredCount']);
    showScreen('auth');
    setupAuthListeners();
}

function notifyContentScript(message) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && (tabs[0].url.includes('twitter.com') || tabs[0].url.includes('x.com'))) {
            chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Content script not ready or tab not a Twitter page. This is expected if the page hasn\'t been reloaded after extension update.');
                }
            });
        }
    });
}
