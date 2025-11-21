// src/content/index.ts
import { scrapeProductPage, autofillUploadPage } from '../utils/dom-helper';

console.log('🔴 RedGen Bridge Connected');

// Listen for messages from the React Side Panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {

    if (message.type === 'SCRAPE_PAGE') {
        const data = scrapeProductPage();
        console.log('RedGen Scraped:', data);
        sendResponse({ success: true, data });
    }

    if (message.type === 'FILL_FORM') {
        console.log('RedGen Filling Form:', message.payload);
        autofillUploadPage(message.payload);
        sendResponse({ success: true });
    }

    // Return true to indicate we will send a response asynchronously if needed
    return true;
});
