export interface Listing {
    id: string;
    createdAt: number;
    title: string; // Display title for the card

    // Visuals
    imagePreview: string | null; // Base64 for UI display

    // User Inputs
    customContext: string;
    preservedTags: string;

    // Data
    scrapedData: {
        title: string;
        tags: string;
        description: string;
    };
    generatedData: {
        title: string;
        tags: string;
        description: string;
    };

    isExpanded?: boolean; // UI state
}

export interface AppSettings {
    apiKey: string;
}
