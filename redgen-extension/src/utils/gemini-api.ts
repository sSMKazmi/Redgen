// src/utils/gemini-api.ts
import { AppSettings } from '../types';

const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1];

export const generateMetadata = async (
    settings: AppSettings, // Receive full settings
    imageBase64: string | null,
    currentData: { title: string; tags: string; description: string }
) => {

    if (!settings.apiKey) throw new Error("Missing API Key");

    // Use Master Prompts or Fallbacks
    const pTitle = settings.titlePrompt || "Optimize for SEO.";
    const pTags = settings.tagsPrompt || "15-20 relevant tags.";
    const pDesc = settings.descPrompt || "Persuasive description.";

    const promptText = `
    You are a Print-on-Demand SEO Expert.
    
    INPUT DATA:
    - Title: ${currentData.title}
    - Tags: ${currentData.tags}
    - Description: ${currentData.description}
    
    YOUR INSTRUCTIONS:
    1. TITLE: ${pTitle}
    2. TAGS: ${pTags}
    3. DESCRIPTION: ${pDesc}
    
    OUTPUT JSON FORMAT:
    { "title": "...", "tags": "tag1, tag2, tag3", "description": "..." }
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

    if (!response.ok) throw new Error("Gemini API Error");

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
};
