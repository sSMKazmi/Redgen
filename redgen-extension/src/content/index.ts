// src/content/index.ts
import { scrapeProductPage, autofillUploadPage } from '../utils/dom-helper';

console.log('🔴 RedGen Bridge Connected');

// --- 1. LISTENERS (Existing) ---
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'SCRAPE_PAGE') {
        const data = scrapeProductPage();
        sendResponse({ success: true, data });
    }
    if (message.type === 'FILL_FORM') {
        autofillUploadPage(message.payload);
        sendResponse({ success: true });
    }
    return true;
});

// --- 2. OVERLAY BUTTON LOGIC (New) ---
const addOverlayButton = () => {
    // Only run on product pages (URLs with /i/)
    if (!window.location.pathname.includes('/i/')) return;

    // Prevent duplicates
    if (document.getElementById('redgen-overlay-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'redgen-overlay-btn';
    btn.innerText = '➕ Add to RedGen';

    // Styling
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '9999',
        backgroundColor: '#ef4444', // Red-500
        color: 'white',
        padding: '10px 20px',
        borderRadius: '50px',
        border: 'none',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontSize: '14px',
        transition: 'transform 0.2s'
    });

    btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
    btn.onmouseout = () => btn.style.transform = 'scale(1)';

    btn.onclick = () => {
        // 1. Scrape Data
        const data = scrapeProductPage();

        // 2. Send to Background to save
        // (We can't save directly to React state from here, so we send a message)
        chrome.runtime.sendMessage({
            type: 'ADD_LISTING_FROM_OVERLAY',
            payload: data
        });

        // 3. Visual Feedback
        const originalText = btn.innerText;
        btn.innerText = '✅ Added!';
        btn.style.backgroundColor = '#10b981'; // Green
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '#ef4444';
        }, 2000);
    };

    document.body.appendChild(btn);
};

// Run on load
addOverlayButton();
// Run on navigation (Redbubble is a Single Page App)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        addOverlayButton();
    }
}).observe(document, { subtree: true, childList: true });
