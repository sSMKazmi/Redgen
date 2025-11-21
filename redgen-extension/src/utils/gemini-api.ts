import { AppSettings } from '../types';

const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1];

// Enhanced return type for risk analysis
export interface OptimizedResult {
    title: string;
    description: string;
    tags: { text: string; risk: 'safe' | 'caution' | 'danger' }[];
}

export const generateMetadata = async (
    settings: AppSettings,
    imageBase64: string | null,
    currentData: { title: string; tags: string; description: string }
): Promise<OptimizedResult> => {

    if (!settings.apiKey) throw new Error("Missing API Key");

    const pTitle = settings.titlePrompt || "Optimize for SEO.";
    const pTags = settings.tagsPrompt || "15-20 relevant tags.";
    const pDesc = settings.descPrompt || "Persuasive description.";

    // --- THE TRADEMARK & SEO MASTER PROMPT ---
    const promptText = `
    ROLE: You are an expert Print-on-Demand SEO Specialist AND a strict Trademark Compliance Officer for Redbubble.
    
    INPUT DATA:
    - Title: ${currentData.title}
    - Tags: ${currentData.tags}
    - Description: ${currentData.description}
    
    USER INSTRUCTIONS:
    1. TITLE: ${pTitle}
    2. TAGS: ${pTags}
    3. DESCRIPTION: ${pDesc}
    
    CRITICAL TRADEMARK SAFETY RULES (Analyze every tag):
    - DANGER (Red): Famous Brands (Nike, Disney), Character Names (Yoda, Mario), Celebrity Names (Taylor Swift), Band Names, Song Lyrics, Movie Titles.
    - CAUTION (Yellow): Broad pop culture references, borderline terms (e.g., "inspired by", "parody"), ambiguous terms.
    - SAFE (Green): Generic descriptive words (retro, sunset, cat, funny, aesthetic, vintage).

    OUTPUT FORMAT (Strict JSON):
    {
      "title": "Optimized Title Here",
      "description": "Optimized Description Here",
      "tags": [
        { "text": "tag1", "risk": "safe" },
        { "text": "tag2", "risk": "caution" },
        { "text": "tag3", "risk": "danger" }
      ]
    }
  `;

    const parts: any[] = [{ text: promptText }];

    if (imageBase64 && imageBase64.startsWith('data:')) {
        parts.push({
            inline_data: {
                mime_type: "image/png",
                data: cleanBase64(imageBase64)
            }
        });
    }

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${settings.apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
        }
    );

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error("Gemini returned no content. It might have been blocked by safety filters.");
    }

    const rawText = data.candidates[0].content.parts[0].text;
    const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
};
