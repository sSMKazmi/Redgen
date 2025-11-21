// src/utils/dom-helper.ts

export const scrapeProductPage = () => {
    try {
        // 1. Grab Title
        const titleContainer = document.querySelector('[class*="ArtworkInfo_titleContainer"]');
        const titleEl = titleContainer?.querySelector('span[class*="styles_display3"]');
        const title = titleEl?.textContent?.trim() || '';

        // 2. Grab Description
        const descEl = titleContainer?.querySelector('span[class*="styles_body"]');
        const description = descEl?.textContent?.trim() || '';

        // 3. Grab Tags
        const tagContainer = document.querySelector('[data-testid="all-product-tags"]');
        const tagLinks = tagContainer?.querySelectorAll('a');
        const tagsArray: string[] = [];
        tagLinks?.forEach(link => {
            const text = link.textContent?.trim();
            if (text) tagsArray.push(text);
        });
        const uniqueTags = [...new Set(tagsArray)].join(', ');

        // 4. Grab Image
        const imgContainer = document.querySelector('[class*="ArtworkInfo_imageContainer"]');
        const imgEl = imgContainer?.querySelector('img');
        const imagePreview = imgEl?.src || '';

        return { title, description, tags: uniqueTags, imagePreview };
    } catch (e) {
        console.error("RedGen Scraper Error:", e);
        return { title: "", description: "", tags: "", imagePreview: "" };
    }
};

export const autofillUploadPage = (data: { title: string; tags: string; description: string }) => {

    // Helper to force value update on React controlled inputs
    const setNativeValue = (element: HTMLElement, value: string) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
            valueSetter.call(element, value);
        } else {
            (element as HTMLInputElement).value = value;
        }

        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
    };

    // --- UPDATED SELECTORS BASED ON YOUR HTML ---
    const titleInput = document.querySelector('#work_title_en') as HTMLInputElement;
    const tagsInput = document.querySelector('#work_tag_field_en') as HTMLTextAreaElement; // <--- FIXED ID
    const descInput = document.querySelector('#work_description_en') as HTMLTextAreaElement;

    if (titleInput) {
        titleInput.focus();
        setNativeValue(titleInput, data.title);
    }

    if (tagsInput) {
        tagsInput.focus();
        setNativeValue(tagsInput, data.tags);
    }

    if (descInput) {
        descInput.focus();
        setNativeValue(descInput, data.description);
    }
};
