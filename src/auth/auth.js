// Initialize Supabase client
const SUPABASE_URL = 'https://vfhibolzkryzcwjswvle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaGlib2x6a3J5emN3anN3dmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDAzNDksImV4cCI6MjA4NjIxNjM0OX0.ThkFOVRqBDbwUMX5mVZbHqlyJc3iKxMQ_6gnJ_BeBnI';

// Wait for supabase bundle to load, then initialize
let supabaseClient;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking window.supabase...');
    console.log('window.supabase:', typeof window.supabase);

    if (!window.supabase) {
        alert('Supabase library failed to load. Please reload the extension.');
        return;
    }

    // Initialize Supabase client
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    });

    const googleSigninBtn = document.getElementById('google-signin');

    console.log('Auth page loaded, Supabase initialized');

    // Check if already signed in
    checkAuthStatus();

    googleSigninBtn.addEventListener('click', async () => {
        try {
            console.log('Google sign-in clicked');
            googleSigninBtn.classList.add('loading');
            googleSigninBtn.textContent = 'Signing in...';

            const redirectUrl = chrome.runtime.getURL('src/auth/auth.html');
            console.log('Redirect URL:', redirectUrl);

            const { data, error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl
                }
            });

            if (error) throw error;

            // OAuth will redirect, so this code may not execute
            console.log('OAuth initiated:', data);
        } catch (error) {
            console.error('Sign in error:', error);
            alert(`Failed to sign in: ${error.message}`);
            googleSigninBtn.classList.remove('loading');
            googleSigninBtn.innerHTML = `
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continue with Google
            `;
        }
    });

    async function checkAuthStatus() {
        try {
            const { data: { session } } = await supabaseClient.auth.getSession();
            console.log('Current session:', session);

            if (session) {
                // Already signed in, store session and close
                await chrome.storage.local.set({
                    supabaseSession: session,
                    isAuthenticated: true
                });

                // Notify background script
                chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', session });

                // Close auth page
                setTimeout(() => window.close(), 1000);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
        }
    }

    // Listen for auth state changes
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session);

        if (event === 'SIGNED_IN' && session) {
            await chrome.storage.local.set({
                supabaseSession: session,
                isAuthenticated: true
            });

            chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS', session });

            // Give user feedback
            alert('Successfully signed in! Redirecting...');
            setTimeout(() => window.close(), 1000);
        }
    });
});
