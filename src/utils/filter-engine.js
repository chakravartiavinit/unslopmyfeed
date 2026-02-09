const SLOP_PATTERNS = {
    flex: [
        /\$\d+[kKmMbB]?/i, // $ price
        /MRR/i,
        /revenue/i,
        /earnings/i,
        /making \$?\d+/i,
        /hustle/i,
        /passive income/i,
        /financial freedom/i,
        /rich/i,
        /wealth/i,
        /unlocked \$\d+/i,
        /scaled to \$\d+/i
    ],
    crypto: [
        /crypto/i,
        /bitcoin/i,
        /eth/i,
        /solana/i,
        /nft/i,
        /shilling/i,
        /moon/i,
        /token/i,
        /airdrop/i,
        /presale/i,
        /bull run/i,
        /gem/i,
        /wallet/i,
        /\$[a-zA-Z]{3,5}/ // Ticker symbols like $SOL, $BTC
    ],
    engagement: [
        /drop a /i,
        /follow/i,
        /retweet/i,
        /like and/i,
        /comment below/i,
        /thread 🧵/i,
        /read more/i,
        /agree\?/i,
        /thoughts\?/i
    ],
    distractions: [
        /thirst/i, /trap/i, /suggestive/i, /revealing/i, /looking for/i
    ]
};

function checkContent(text, activeFilters) {
    const results = {
        isSlop: false,
        categories: []
    };

    if (!text) return results;

    for (const [category, patterns] of Object.entries(SLOP_PATTERNS)) {
        if (!activeFilters[category]) continue;

        for (const pattern of patterns) {
            if (pattern.test(text)) {
                results.isSlop = true;
                results.categories.push(category);
                break; // Move to next category
            }
        }
    }

    return results;
}

// In Chrome Extensions, we can't easily export/import without build tools
// We'll attach it to a global if needed or just copy it into the content script
if (typeof module !== 'undefined') {
    module.exports = { checkContent, SLOP_PATTERNS };
}
