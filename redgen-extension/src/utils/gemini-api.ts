import { AppSettings } from '../types';

const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1];

// Enhanced return type for risk analysis
export interface OptimizedResult {
    title: string;
    description: string;
    tags: { text: string; riskScore: number }[];
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
    
    CRITICAL TRADEMARK SAFETY RULES (Analyze every tag and assign a Risk Score 1-5):
    - 5 (DANGER - RED): Famous Brands (Nike, Disney), Character Names (Yoda, Mario), Celebrity Names, Song Lyrics, Movie Titles.
    - 4 (HIGH RISK - ORANGE): Specific fictional locations, borderline trademarks, very specific fandom terms.
    - 3 (CAUTION - YELLOW): Broad pop culture references, parodies, "inspired by" terms, ambiguous words.
    - 2 (LOW RISK - LIME): Common phrases that might have weak claims, broad artistic styles.
    - 1 (SAFE - GREEN): Generic descriptive words (retro, sunset, cat, funny, aesthetic, vintage, blue, cute).

    OUTPUT FORMAT (Strict JSON):
    {
      "title": "Optimized Title Here",
      "description": "Optimized Description Here",
      "tags": [
        { "text": "tag1", "riskScore": 1 },
        { "text": "tag2", "riskScore": 3 },
        { "text": "tag3", "riskScore": 5 }
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
