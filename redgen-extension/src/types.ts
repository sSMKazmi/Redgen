export interface TagItem {
    text: string;
    riskScore: number; // 1 (Safe) to 5 (Danger)
}

export interface Listing {
    id: string;
    createdAt: number;
    title: string;
    imagePreview: string | null;

    customContext: string;
    preservedTags: string; // Comma separated string (User manages these manually)

    scrapedData: {
        title: string;
        tags: string; // Original scraped string
        description: string;
    };

    generatedData: {
        title: string;
        tags: TagItem[]; // <--- CHANGED to Rich Objects
        description: string;
    };

    isExpanded?: boolean;
}

export interface AppSettings {
    apiKey: string;
    titlePrompt: string;
    tagsPrompt: string;
    descPrompt: string;
}
