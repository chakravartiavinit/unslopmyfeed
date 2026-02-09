// Basic filter engine integration (since we're not using modules, we'll recreate the logic or inject it)
// In a production app, we'd use a bundler or import/export if manifest v3 supports it cleanly across all browsers.
// Here we'll just include the logic directly to ensure it works.

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

function checkContent(text, activeFilters) {
    const results = { isSlop: false, categories: [] };
    if (!text) return results;
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
    return results;
}

function checkMedia(tweet, activeFilters) {
    const results = { isSlop: false, categories: [] };
    if (!activeFilters.distractions) return results;

    // Detect video elements or thumbnails
    const hasVideo = tweet.querySelector('video') || tweet.querySelector('[data-testid="videoPlayer"]');
    const images = Array.from(tweet.querySelectorAll('img[src*="media"]'));

    // Heuristic: If it has a video and a "suspicious" keyword in tweet or is just highly visual
    // For now, let's flag videos as "distractions" if the category is enabled
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

// Load settings initially
chrome.storage.local.get(['filters'], (result) => {
    if (result.filters) {
        activeSettings = result.filters;
    }
    cleanFeed();
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SETTINGS_CHANGED') {
        activeSettings = message.settings;
        cleanFeed();
    } else if (message.type === 'TRIGGER_CLEAN') {
        triggerDusting();
    } else if (message.type === 'SHOW_FILTERED') {
        showFilteredPosts();
    }
});

function cleanFeed() {
    // X (Twitter) tweet selector
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    let filteredCount = 0;

    tweets.forEach(tweet => {
        // Extract text
        const tweetTextEl = tweet.querySelector('div[data-testid="tweetText"]');
        if (!tweetTextEl) return;

        const text = tweetTextEl ? tweetTextEl.innerText : '';
        const textResult = checkContent(text, activeSettings);
        const mediaResult = checkMedia(tweet, activeSettings);

        const categories = [...new Set([...textResult.categories, ...mediaResult.categories])];
        const isSlop = textResult.isSlop || mediaResult.isSlop;

        if (isSlop) {
            applySlopAction(tweet, categories);
            filteredCount++;
        } else {
            // Restore if previously hidden
            tweet.style.display = 'block';
            tweet.style.filter = 'none';
            tweet.style.opacity = '1';
        }
    });

    // Store the count (only if extension context is still valid)
    if (chrome.runtime?.id) {
        chrome.storage.local.set({ filteredCount });
    }
}

function triggerDusting() {
    // Create premium shimmer overlay
    const overlay = document.createElement('div');
    overlay.className = 'unslop-cleaning-overlay';
    document.body.appendChild(overlay);

    // Identify posts to remove
    const tweets = document.querySelectorAll('article[data-testid="tweet"]');
    const postsToRemove = [];

    tweets.forEach(tweet => {
        const tweetTextEl = tweet.querySelector('div[data-testid="tweetText"]');
        const text = tweetTextEl ? tweetTextEl.innerText : '';
        const textResult = checkContent(text, activeSettings);
        const mediaResult = checkMedia(tweet, activeSettings);
        if (textResult.isSlop || mediaResult.isSlop) {
            postsToRemove.push({ tweet, categories: [...new Set([...textResult.categories, ...mediaResult.categories])] });
        }
    });

    // Stagger the removal animation for smooth effect
    postsToRemove.forEach((item, index) => {
        setTimeout(() => {
            item.tweet.classList.add('unslop-removing');
        }, index * 40); // 40ms stagger for smooth cascade
    });

    // Apply the actual filtering after animations complete
    setTimeout(() => {
        overlay.remove();
        cleanFeed();
    }, 600 + (postsToRemove.length * 40));
}

function showFilteredPosts() {
    const filteredPosts = document.querySelectorAll('.unslop-detected');

    if (filteredPosts.length === 0) {
        alert('No filtered posts found!');
        return;
    }

    // Scroll to first filtered post
    filteredPosts[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Pulse effect on all filtered posts
    filteredPosts.forEach((post, index) => {
        setTimeout(() => {
            post.style.outline = '3px solid #58a6ff';
            post.style.outlineOffset = '4px';
            setTimeout(() => {
                post.style.outline = '';
                post.style.outlineOffset = '';
            }, 1500);
        }, index * 100);
    });
}

function applySlopAction(tweet, categories) {
    // Check if already processed
    if (tweet.classList.contains('unslop-detected')) return;

    tweet.classList.add('unslop-detected', 'unslop-blurred');

    // Add a overlay to explain why it's blurred
    const overlay = document.createElement('div');
    overlay.className = 'unslop-overlay';
    overlay.innerHTML = `
        <div class="unslop-label">
            <span>🚫 Filtered: ${categories.join(', ')}</span>
            <span style="font-size: 10px; opacity: 0.7; margin-left: 8px;">Click to view</span>
        </div>
    `;

    // Make it clickable to reveal
    overlay.style.cursor = 'pointer';
    overlay.onclick = (e) => {
        e.stopPropagation();
        tweet.classList.remove('unslop-blurred');
        overlay.remove();
    };

    // Add to review queue automatically
    const tweetText = tweet.innerText.substring(0, 200);
    logForReview(tweetText, categories);

    tweet.appendChild(overlay);
}

function logForReview(text, categories) {
    if (!chrome.runtime?.id) return;
    chrome.storage.local.get(['reviewQueue'], (result) => {
        const queue = result.reviewQueue || [];
        queue.push({
            text,
            categories,
            timestamp: Date.now()
        });
        chrome.storage.local.set({ reviewQueue: queue });
    });
}

// Observe for new tweets
const observer = new MutationObserver((mutations) => {
    // Stop observing if extension context is invalidated
    if (!chrome.runtime?.id) {
        observer.disconnect();
        return;
    }
    let shouldClean = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            shouldClean = true;
            break;
        }
    }
    if (shouldClean) {
        cleanFeed();
    }
});

observer.observe(document.body, { childList: true, subtree: true });
