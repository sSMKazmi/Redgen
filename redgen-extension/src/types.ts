export interface TagItem {
    text: string;
    riskScore: number; // 1 (Safe) to 5 (Danger)
}

export interface Listing {
    id: string;
    createdAt: number;
    title: string;

    // CHANGED: Now supports multiple images
    images: string[];

    customContext: string;
    preservedTags: string;

    scrapedData: {
        title: string;
        tags: string;
        description: string;
    };

    generatedData: {
        title: string;
        tags: TagItem[];
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
