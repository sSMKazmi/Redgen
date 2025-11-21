// service-worker.js

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

// Listen for overlay clicks
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_LISTING_FROM_OVERLAY') {

        // Get current listings
        chrome.storage.local.get(['listings'], (result) => {
            const listings = result.listings || [];

            // Create new listing object
            const newListing = {
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                title: message.payload.title || "Scraped Product",
                imagePreview: message.payload.imagePreview,
                customContext: "",
                preservedTags: "",
                scrapedData: message.payload, // Save to Source Tab
                generatedData: message.payload, // Copy to Optimized Tab initially
                isExpanded: true
            };

            // Save back to storage
            chrome.storage.local.set({ listings: [newListing, ...listings] });

            // Optional: Open Side Panel
            // chrome.sidePanel.open({ tabId: sender.tab.id }); (Requires specific user gesture context)
        });
    }
});
