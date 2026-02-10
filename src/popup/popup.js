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
    const {
        filters: localFilters,
        customRules: localRules,
        filteredCount,
        allTimeFiltered
    } = await chrome.storage.local.get(['filters', 'customRules', 'filteredCount', 'allTimeFiltered']);

    // Load from Supabase (Source of Truth) or fallback to local
    const { data: cloudSettings } = await supabaseClient
        .from('user_settings')
        .select('filters, custom_patterns')
        .eq('user_id', user.id)
        .single();

    const currentFilters = cloudSettings?.filters || localFilters || { flex: true, crypto: true, engagement: true, distractions: true };
    const currentCustomRules = cloudSettings?.custom_patterns || localRules || [];

    // Sync state to local and UI
    await chrome.storage.local.set({ filters: currentFilters, customRules: currentCustomRules });

    document.getElementById('filtered-count').textContent = filteredCount || 0;
    document.getElementById('session-filtered').textContent = filteredCount || 0;
    document.getElementById('alltime-filtered').textContent = allTimeFiltered || 0;

    const rulesList = document.getElementById('custom-rules-list');
    renderCustomRules(currentCustomRules, rulesList, user.id);

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
                const { customRules } = await chrome.storage.local.get(['customRules']);
                notifyContentScript({ type: 'SETTINGS_CHANGED', settings: newFilters, customRules: customRules || [] });

                // Sync to Cloud
                await supabaseClient
                    .from('user_settings')
                    .upsert({ user_id: user.id, filters: newFilters, custom_patterns: customRules }, { onConflict: 'user_id' });
            };
        }
    });

    // Custom Rules Logic
    const customInput = document.getElementById('custom-slop-input');
    const addBtn = document.getElementById('add-custom-nuke');

    addBtn.onclick = async () => {
        const text = customInput.value.trim();
        if (!text) return;

        const { customRules: rules } = await chrome.storage.local.get(['customRules']);
        const updatedRules = rules || [];

        const newRule = {
            id: Date.now().toString(),
            prompt: text,
            active: true,
            keywords: text.toLowerCase().split(' ').filter(w => w.length > 3)
        };

        updatedRules.push(newRule);
        await chrome.storage.local.set({ customRules: updatedRules });
        customInput.value = '';
        renderCustomRules(updatedRules, rulesList, user.id);

        const { filters: currentF } = await chrome.storage.local.get(['filters']);
        notifyContentScript({
            type: 'SETTINGS_CHANGED',
            settings: currentF || currentFilters,
            customRules: updatedRules
        });

        // Sync to Cloud
        await supabaseClient
            .from('user_settings')
            .upsert({ user_id: user.id, filters: currentF, custom_patterns: updatedRules }, { onConflict: 'user_id' });
    };

    customInput.onkeypress = (e) => {
        if (e.key === 'Enter') addBtn.onclick();
    };

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

function renderCustomRules(rules, container, userId) {
    container.innerHTML = '';
    rules.forEach(rule => {
        const item = document.createElement('div');
        item.className = 'custom-rule-item';
        item.innerHTML = `
            <span class="rule-text">${rule.prompt}</span>
            <button class="delete-rule" data-id="${rule.id}">✕</button>
        `;

        item.querySelector('.delete-rule').onclick = async () => {
            const { customRules: rules } = await chrome.storage.local.get(['customRules']);
            const filtered = (rules || []).filter(r => r.id !== rule.id);
            await chrome.storage.local.set({ customRules: filtered });
            renderCustomRules(filtered, container, userId);

            const { filters } = await chrome.storage.local.get(['filters']);
            notifyContentScript({
                type: 'SETTINGS_CHANGED',
                settings: filters,
                customRules: filtered
            });

            // Sync to Cloud
            await supabaseClient
                .from('user_settings')
                .upsert({ user_id: userId, filters: filters, custom_patterns: filtered }, { onConflict: 'user_id' });
        };

        container.appendChild(item);
    });
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
