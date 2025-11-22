// service-worker.js

chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .catch((error) => console.error(error));

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ADD_LISTING_FROM_OVERLAY') {

        chrome.storage.local.get(['listings'], (result) => {
            const listings = result.listings || [];

            // Convert tags string to array immediately
            const tagsArray = message.payload.tags
                ? message.payload.tags.split(',').map(t => ({ text: t.trim(), riskScore: 1 }))
                : [];

            const newListing = {
                id: crypto.randomUUID(),
                createdAt: Date.now(),
                title: message.payload.title || "Scraped Product",

                // SAVE THE ARRAY
                images: message.payload.images || [],

                customContext: "",
                preservedTags: "",
                scrapedData: message.payload,
                generatedData: {
                    ...message.payload,
                    tags: tagsArray // Save as Array!
                },
                isExpanded: true
            };

            chrome.storage.local.set({ listings: [newListing, ...listings] });
        });
    }
});
