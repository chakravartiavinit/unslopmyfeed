// Content script for unslopmyfeed - filters slop from X/Twitter feed

const SLOP_PATTERNS = {
    flex: [
        /\$\d+[kKmMbB]?/i,
        /MRR/i, /revenue/i, /earnings/i, /making \$?\d+/i, /hustle/i, /passive income/i,
        /financial freedom/i, /rich/i, /wealth/i, /unlocked \$\d+/i, /scaled to \$\d+/i
    ],
    crypto: [
        /crypto/i, /bitcoin/i, /eth/i, /solana/i, /nft/i, /shilling/i, /moon/i,
        /token/i, /airdrop/i, /presale/i, /bull run/i, /gem/i, /wallet/i, /\$[a-zA-Z]{3,5}/
    ],
    engagement: [
        /drop a /i, /follow/i, /retweet/i, /like and/i, /comment below/i, /thread 🧵/i,
        /read more/i, /agree\?/i, /thoughts\?/i
    ],
    distractions: [
        /thirst/i, /trap/i, /suggestive/i, /revealing/i, /looking for/i
    ]
};

function checkContent(text, activeFilters, customRules) {
    const results = { isSlop: false, categories: [] };
    if (!text) return results;

    // Standard Filters
    for (const [category, patterns] of Object.entries(SLOP_PATTERNS)) {
        if (!activeFilters[category]) continue;
        for (const pattern of patterns) {
            if (pattern.test(text)) {
                results.isSlop = true;
                results.categories.push(category);
                break;
            }
        }
    }

    // Custom AI Rules
    if (customRules && customRules.length > 0) {
        const lowerText = text.toLowerCase();
        customRules.forEach(rule => {
            if (!rule.active || !rule.keywords) return;
            for (const kw of rule.keywords) {
                if (lowerText.includes(kw.toLowerCase())) {
                    results.isSlop = true;
                    results.categories.push(`custom:${rule.prompt.substring(0, 15)}...`);
                    break;
                }
            }
        });
    }

    return results;
}

function checkMedia(tweet, activeFilters) {
    const results = { isSlop: false, categories: [] };
    if (!activeFilters.distractions) return results;

    const hasVideo = tweet.querySelector('video') || tweet.querySelector('[data-testid="videoPlayer"]');
    if (hasVideo) {
        results.isSlop = true;
        results.categories.push('distractions');
    }

    return results;
}

let activeSettings = {
    flex: true,
    crypto: true,
    engagement: true,
    distractions: true
};
let customRules = [];

// Load settings initially
chrome.storage.local.get(['filters', 'customRules'], (result) => {
    if (result.filters) {
        activeSettings = result.filters;
    }
    if (result.customRules) {
        customRules = result.customRules;
    }
    cleanFeed();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_CHANGED') {
        activeSettings = message.settings;
        customRules = message.customRules || [];
        // Reset all detected tweets so they get re-evaluated
        document.querySelectorAll('.unslop-detected').forEach(tweet => {
            const bar = tweet.querySelector('.unslop-bar');
            if (bar) {
                // Restore hidden children
                Array.from(tweet.children).forEach(child => {
                    if (child !== bar && child.style.display === 'none') {
                        child.style.display = child.getAttribute('data-unslop-display') || '';
                        child.removeAttribute('data-unslop-display');
                    }
                });
                bar.remove();
            }
            tweet.classList.remove('unslop-detected');
        });
        cleanFeed();
    } else if (message.type === 'TRIGGER_CLEAN') {
        triggerDusting();
    }
});

function cleanFeed() {
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let filteredCount = 0;

    tweets.forEach(tweet => {
        // Skip if already processed
        if (tweet.classList.contains('unslop-detected')) {
            filteredCount++;
            return;
        }

        const tweetTextEl = tweet.querySelector('div[data-testid="tweetText"]');
        const text = tweetTextEl ? tweetTextEl.innerText : '';
        const textResult = checkContent(text, activeSettings, customRules);
        const mediaResult = checkMedia(tweet, activeSettings);

        const categories = [...new Set([...textResult.categories, ...mediaResult.categories])];
        const isSlop = textResult.isSlop || mediaResult.isSlop;

        if (isSlop) {
            applySlopAction(tweet, categories);
            filteredCount++;
        }
    });

    // Store session count (not cumulative — just current visible filtered)
    if (chrome.runtime?.id) {
        chrome.storage.local.get(['allTimeFiltered', 'lastFilteredCount'], (result) => {
            const lastCount = result.lastFilteredCount || 0;
            const newDetections = Math.max(0, filteredCount - lastCount);
            const allTime = (result.allTimeFiltered || 0) + newDetections;
            chrome.storage.local.set({
                filteredCount,
                lastFilteredCount: filteredCount,
                allTimeFiltered: allTime
            });
        });
    }
}

function triggerDusting() {
    // Create the dusting overlay
    const overlay = document.createElement('div');
    overlay.className = 'unslop-dusting-overlay';

    const cleanLine = document.createElement('div');
    cleanLine.className = 'unslop-clean-line';

    const brush = document.createElement('div');
    brush.className = 'unslop-brush-tool';
    brush.innerText = '🧹';

    overlay.appendChild(cleanLine);
    overlay.appendChild(brush);

    // Create some initial dust particles
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'unslop-dust-particle';
        p.innerText = ['✨', '☁️', '❄️'][Math.floor(Math.random() * 3)];

        // Random position and destination for float animation
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const tx = (Math.random() - 0.5) * 200;
        const ty = -100 - Math.random() * 100;

        p.style.left = `${startX}vw`;
        p.style.top = `${startY}vh`;
        p.style.setProperty('--p-tx', `${tx}px`);
        p.style.setProperty('--p-ty', `${ty}px`);
        p.style.animationDelay = `${Math.random() * 0.5}s`;

        overlay.appendChild(p);
    }

    document.body.appendChild(overlay);

    // Start the sweep animation
    requestAnimationFrame(() => {
        overlay.classList.add('unslop-sweeping');
    });

    // Run the actual clean in sync with the sweep
    setTimeout(() => {
        // Reset all detected tweets so they get re-processed fresh
        document.querySelectorAll('.unslop-detected').forEach(tweet => {
            tweet.classList.remove('unslop-detected', 'unslop-hidden');
            tweet.removeAttribute('data-unslop-categories');
        });
        cleanFeed();
    }, 600); // Trigger cleanup when the line is roughly in the middle

    // Cleanup the overlay
    setTimeout(() => {
        overlay.remove();
    }, 1500);
}

function applySlopAction(tweet, categories) {
    if (tweet.classList.contains('unslop-detected')) return;
    tweet.classList.add('unslop-detected', 'unslop-hidden');

    // Optional: Add a small unobtrusive indicator or just hide it completely
    // For now, we follow the request to "just hide the tweet" but with a redesign
    // Setting a data attribute for tracking categories if needed later
    tweet.setAttribute('data-unslop-categories', categories.join(','));
}

// Block click from navigating on any accidental clicks if any remnant of our UI exists
document.addEventListener('click', (e) => {
    if (e.target.closest('.unslop-detected')) {
        // If we want it completely non-interactive when hidden
        if (e.target.closest('.unslop-hidden')) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    }
}, true);

// Debounced observer — avoids excessive re-runs
let cleanTimeout = null;
const observer = new MutationObserver((mutations) => {
    if (!chrome.runtime?.id) {
        observer.disconnect();
        return;
    }
    let shouldClean = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            // Only trigger if an actual tweet article was added
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1 && (node.matches?.('article[data-testid="tweet"]') || node.querySelector?.('article[data-testid="tweet"]'))) {
                    shouldClean = true;
                    break;
                }
            }
        }
        if (shouldClean) break;
    }
    if (shouldClean) {
        clearTimeout(cleanTimeout);
        cleanTimeout = setTimeout(() => cleanFeed(), 200);
    }
});

observer.observe(document.body, { childList: true, subtree: true });
