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
    btn.innerHTML = `
        <span style="font-size: 16px; margin-right: 6px;">🚀</span> 
        <span style="font-weight: 700; letter-spacing: 0.5px;">Add to RedGen</span>
    `;

    // Styling
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: '2147483647', // Max z-index
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', // Red-500 to Red-600
        color: 'white',
        padding: '12px 24px',
        borderRadius: '9999px',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2)', // Red shadow
        fontSize: '14px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        backdropFilter: 'blur(4px)'
    });

    // Hover Effects
    btn.onmouseover = () => {
        btn.style.transform = 'translateY(-2px) scale(1.02)';
        btn.style.boxShadow = '0 20px 25px -5px rgba(220, 38, 38, 0.5), 0 10px 10px -5px rgba(220, 38, 38, 0.3)';
    };
    btn.onmouseout = () => {
        btn.style.transform = 'translateY(0) scale(1)';
        btn.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.4), 0 4px 6px -2px rgba(220, 38, 38, 0.2)';
    };

    btn.onclick = () => {
        // 1. Scrape Data
        const data = scrapeProductPage();

        // 2. Send to Background to save
        chrome.runtime.sendMessage({
            type: 'ADD_LISTING_FROM_OVERLAY',
            payload: data
        });

        // 3. Visual Feedback
        const originalContent = btn.innerHTML;
        const originalBg = btn.style.background;

        btn.innerHTML = `<span style="font-size: 16px; margin-right: 6px;">✅</span> <span style="font-weight: 700;">Added!</span>`;
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)'; // Emerald-500 to Emerald-600
        btn.style.boxShadow = '0 10px 15px -3px rgba(5, 150, 105, 0.4)';
        btn.style.transform = 'scale(0.95)';

        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = originalBg;
            btn.style.boxShadow = '0 10px 15px -3px rgba(220, 38, 38, 0.4)';
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
