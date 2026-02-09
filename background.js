// Background script for unslopmyfeed with Supabase authentication

// Check auth status on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('unslopmyfeed extension installed/updated');

    if (details.reason === 'install') {
        // First install - open auth page
        openAuthPage();
    } else if (details.reason === 'update') {
        // Check if user was authenticated before update
        const { isAuthenticated, authSkipped } = await chrome.storage.local.get(['isAuthenticated', 'authSkipped']);

        if (!isAuthenticated && !authSkipped) {
            openAuthPage();
        }
    }
});

// Check auth on startup
chrome.runtime.onStartup.addListener(async () => {
    const { isAuthenticated, authSkipped, supabaseSession } = await chrome.storage.local.get([
        'isAuthenticated',
        'authSkipped',
        'supabaseSession'
    ]);

    if (!isAuthenticated && !authSkipped) {
        openAuthPage();
    } else if (supabaseSession) {
        // Session exists, could validate/refresh here
        console.log('User session found');
    }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'AUTH_SUCCESS') {
        console.log('User authenticated successfully');
        // Could sync settings here
    } else if (request.type === 'SIGN_OUT') {
        handleSignOut();
    } else if (request.type === 'CHECK_AUTH') {
        checkAuthStatus().then(sendResponse);
        return true; // Keep channel open for async response
    }
});

function openAuthPage() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('src/auth/auth.html')
    });
}

async function handleSignOut() {
    await chrome.storage.local.remove(['isAuthenticated', 'supabaseSession']);
    console.log('User signed out');
}

async function checkAuthStatus() {
    const { isAuthenticated, supabaseSession } = await chrome.storage.local.get([
        'isAuthenticated',
        'supabaseSession'
    ]);

    return {
        isAuthenticated: !!isAuthenticated,
        hasSession: !!supabaseSession
    };
}
