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

        // 4. Grab HIGH-RES Images (The new logic)
        const images: string[] = [];

        // We target the main swiper slides (ignoring the small carousel below it)
        const slideImages = document.querySelectorAll('[data-testid="product-preview-image"] .swiper-slide img');

        slideImages.forEach((img: any) => {
            // Try to get the best resolution from srcset first
            let src = img.currentSrc || img.src;

            // If possible, force the x1000 version if available in the source set but not active
            // (Redbubble URL hack: usually just ensuring we don't get the tiny thumb)
            if (src && !images.includes(src)) {
                images.push(src);
            }
        });

        // Fallback if swiper logic fails (grab the og:image or similar)
        if (images.length === 0) {
            const mainImg = document.querySelector('[class*="ArtworkInfo_imageContainer"] img') as HTMLImageElement;
            if (mainImg?.src) images.push(mainImg.src);
        }

        return { title, description, tags: uniqueTags, images };
    } catch (e) {
        console.error("RedGen Scraper Error:", e);
        return { title: "", description: "", tags: "", images: [] };
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

    const titleInput = document.querySelector('#work_title_en') as HTMLInputElement;
    const tagsInput = document.querySelector('#work_tag_field_en') as HTMLTextAreaElement;
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
