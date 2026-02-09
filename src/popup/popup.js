document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication status first
    const { isAuthenticated, authSkipped } = await chrome.storage.local.get(['isAuthenticated', 'authSkipped']);

    if (!isAuthenticated && !authSkipped) {
        // User is not authenticated - redirect to auth page
        chrome.tabs.create({
            url: chrome.runtime.getURL('src/auth/auth.html')
        });
        window.close();
        return;
    }

    const filters = ['flex', 'crypto', 'engagement', 'distractions'];
    const filterEls = {};

    // Elements
    const reviewCountBadge = document.getElementById('review-count');
    const reviewList = document.getElementById('review-list');
    const healthValue = document.getElementById('health-value');
    const filteredCount = document.getElementById('filtered-count');
    const cleanBtn = document.getElementById('clean-now');

    // Load saved settings
    chrome.storage.local.get(['filters', 'reviewQueue', 'filteredCount'], (result) => {
        const savedFilters = result.filters || {
            flex: true,
            crypto: true,
            engagement: true,
            distractions: true
        };

        filters.forEach(id => {
            const el = document.getElementById(`filter-${id}`);
            if (el) {
                el.checked = savedFilters[id];
                filterEls[id] = el;
                el.addEventListener('change', () => {
                    saveSettings();
                    notifyContentScript({ type: 'SETTINGS_CHANGED', settings: getSettings() });
                });
            }
        });

        updateReviewUI(result.reviewQueue || []);
        updateStatsUI(result.filteredCount || 0);
    });

    // Poll for updates every 2 seconds
    setInterval(() => {
        chrome.storage.local.get(['filteredCount'], (result) => {
            updateStatsUI(result.filteredCount || 0);
        });
    }, 2000);

    function getSettings() {
        const settings = {};
        filters.forEach(id => {
            if (filterEls[id]) settings[id] = filterEls[id].checked;
        });
        return settings;
    }

    function saveSettings() {
        chrome.storage.local.set({ filters: getSettings() });
    }

    function notifyContentScript(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && (tabs[0].url.includes('twitter.com') || tabs[0].url.includes('x.com'))) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            }
        });
    }

    function updateReviewUI(queue) {
        reviewCountBadge.textContent = queue.length;
        if (queue.length === 0) {
            reviewList.classList.add('empty');
            reviewList.innerHTML = '<p class="empty-msg">No posts awaiting review.</p>';
            return;
        }

        reviewList.classList.remove('empty');
        reviewList.innerHTML = '';

        // Show last 3 items
        queue.slice(-3).reverse().forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'review-item';
            div.style.cssText = 'background: #21262d; padding: 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px; border: 1px solid #30363d; overflow: hidden;';
            div.innerHTML = `
                <div style="color: #8b949e; margin-bottom: 4px; display: flex; justify-content: space-between;">
                    <span>${item.categories.join(', ')}</span>
                    <span>${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden; margin-bottom: 6px;">
                    ${item.text}
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="small-btn block-btn" data-index="${queue.length - 1 - index}" style="background: #da3633; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;">Block Similar</button>
                    <button class="small-btn skip-btn" data-index="${queue.length - 1 - index}" style="background: #30363d; color: white; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer;">Ignore</button>
                </div>
            `;
            reviewList.appendChild(div);
        });

        // Add event listeners for block/skip
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.onclick = (e) => handleReviewAction(e.target.dataset.index, 'block');
        });
        document.querySelectorAll('.skip-btn').forEach(btn => {
            btn.onclick = (e) => handleReviewAction(e.target.dataset.index, 'skip');
        });
    }

    function handleReviewAction(index, action) {
        chrome.storage.local.get(['reviewQueue'], (result) => {
            const queue = result.reviewQueue || [];
            if (action === 'block') {
                // Future: add to custom blocklist
                console.log('Blocking similar to:', queue[index].text);
            }
            queue.splice(index, 1);
            chrome.storage.local.set({ reviewQueue: queue }, () => {
                updateReviewUI(queue);
            });
        });
    }

    function updateStatsUI(count) {
        filteredCount.textContent = count;
        if (count === 0) {
            healthValue.textContent = 'Clean';
            healthValue.style.color = '#2ea043';
        } else if (count < 5) {
            healthValue.textContent = 'Good';
            healthValue.style.color = '#58a6ff';
        } else {
            healthValue.textContent = 'Sloppy';
            healthValue.style.color = '#f85149';
        }
    }

    cleanBtn.addEventListener('click', () => {
        notifyContentScript({ type: 'TRIGGER_CLEAN' });

        // Visual feedback
        const originalText = cleanBtn.textContent;
        cleanBtn.textContent = 'Cleaning...';
        cleanBtn.style.opacity = '0.7';
        setTimeout(() => {
            cleanBtn.textContent = originalText;
            cleanBtn.style.opacity = '1';
        }, 1000);
    });

    const viewFilteredBtn = document.getElementById('view-filtered');
    if (viewFilteredBtn) {
        viewFilteredBtn.addEventListener('click', () => {
            notifyContentScript({ type: 'SHOW_FILTERED' });
            window.close();
        });
    }

    // Sign out functionality
    const signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
        signOutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to sign out? Your settings will remain saved in the cloud.')) {
                await chrome.storage.local.remove(['isAuthenticated', 'supabaseSession']);
                chrome.runtime.sendMessage({ type: 'SIGN_OUT' });

                // Redirect to auth page
                chrome.tabs.create({
                    url: chrome.runtime.getURL('src/auth/auth.html')
                });
                window.close();
            }
        });
    }
});
