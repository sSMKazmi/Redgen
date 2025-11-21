// src/types.ts

export interface Listing {
    id: string;
    createdAt: number;
    title: string;

    imagePreview: string | null;

    // User Inputs for this specific listing
    customContext: string; // e.g., "Make it spooky"
    preservedTags: string;

    // Tab 1: What we grabbed
    scrapedData: {
        title: string;
        tags: string;
        description: string;
    };

    // Tab 2: What AI made (The output)
    generatedData: {
        title: string;
        tags: string;
        description: string;
    };

    isExpanded?: boolean;
}

export interface AppSettings {
    apiKey: string;
    // The Master Prompts
    titlePrompt: string;
    tagsPrompt: string;
    descPrompt: string;
}
