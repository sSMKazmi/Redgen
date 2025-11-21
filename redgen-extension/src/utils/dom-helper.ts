// src/utils/dom-helper.ts

// === SCOUT: Reads the page ===
export const scrapeProductPage = () => {
    // 1. Grab Title
    // Redbubble titles usually use specific classes, but H1 is a safe fallback
    const titleEl = document.querySelector('h1') || document.querySelector('[data-testid="product-title"]');
    const title = titleEl?.textContent?.trim() || '';

    // 2. Grab Description
    const descEl = document.querySelector('[data-testid="product-description"]');
    const description = descEl?.textContent?.trim() || '';

    // 3. Grab Tags
    // Redbubble puts tags in links like /shop/t-shirts?query=tagname
    // We look for the keywords section
    const tagElements = document.querySelectorAll('a[href*="/shop/"]');
    const tagsArray: string[] = [];

    tagElements.forEach(el => {
        const text = el.textContent?.trim();
        // Simple filter to avoid grabbing menu items, only grab actual tags
        if (text && text.length > 2 && !text.includes('Shop')) {
            tagsArray.push(text);
        }
    });

    // Deduplicate and take top 15 tags (Redbubble limit is often 15-50)
    const uniqueTags = [...new Set(tagsArray)].slice(0, 15).join(', ');

    return { title, description, tags: uniqueTags };
};

// === WORKER: Fills the form ===
export const autofillUploadPage = (data: { title: string; tags: string; description: string }) => {

    // Helper to force React to notice the value change
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

    const fillInput = (selector: string, value: string, isArea = false) => {
        const el = document.querySelector(selector);
        if (!el) return;

        // Focus triggers
        (el as HTMLElement).focus();

        // Set value utilizing the prototype to bypass React suppression
        const setter = isArea ? nativeTextAreaValueSetter : nativeInputValueSetter;
        setter?.call(el, value);

        // Dispatch events so Redbubble's validation sees it
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        (el as HTMLElement).blur();
    };

    // Redbubble specific IDs (based on standard English form)
    fillInput('#work_title_en', data.title);
    fillInput('#work_tags', data.tags, true); // Tags is usually a textarea or special input
    fillInput('#work_description_en', data.description, true);
};
