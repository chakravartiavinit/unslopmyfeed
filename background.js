// Check auth status on install/update
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('unslopmyfeed extension installed/updated');
    // We no longer pro-actively open an auth page.
    // The user will be prompted to sign in when they open the popup.
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'AUTH_SUCCESS') {
        console.log('User authenticated successfully');
    } else if (request.type === 'SIGN_OUT') {
        handleSignOut();
    }
});

async function handleSignOut() {
    await chrome.storage.local.remove(['isAuthenticated', 'supabaseSession', 'filteredCount']);
    console.log('User signed out and local state cleared');
}
