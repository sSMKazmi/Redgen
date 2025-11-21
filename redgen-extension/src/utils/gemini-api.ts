// src/utils/gemini-api.ts

// Helper: Clean Base64 string (remove "data:image/png;base64," header)
const cleanBase64 = (dataUrl: string) => {
    return dataUrl.split(',')[1];
};

export const generateMetadata = async (
    apiKey: string,
    imageBase64: string | null,
    context: string,
    scrapedData: { title: string; tags: string }
) => {

    if (!apiKey) throw new Error("Missing Gemini API Key in Settings.");

    // The System Prompt: Strict JSON enforcement
    const promptText = `
    You are an expert Print-on-Demand (POD) SEO Specialist for Redbubble.
    
    TASK:
    Analyze the provided image (if any) and the reference metadata.
    Generate OPTIMIZED Title, Tags, and Description.
    
    USER CONTEXT / INSTRUCTIONS:
    "${context}"
    
    REFERENCE DATA (Use as inspiration, do not copy directly):
    Title: ${scrapedData.title}
    Tags: ${scrapedData.tags}
    
    OUTPUT RULES:
    1. Return PURE JSON only. No markdown, no backticks.
    2. JSON Format: { "title": "...", "tags": "tag1, tag2, tag3", "description": "..." }
    3. Title: Catchy, SEO-friendly (Max 60 chars).
    4. Tags: 15-20 high-relevance tags, separated by commas.
    5. Description: Persuasive sales copy (2-3 sentences).
  `;

    // Construct Payload
    const contents = [];

    // Add Text Prompt
    const parts: any[] = [{ text: promptText }];

    // Add Image if exists
    if (imageBase64) {
        parts.push({
            inline_data: {
                mime_type: "image/png", // Assuming PNG/JPG
                data: cleanBase64(imageBase64)
            }
        });
    }

    contents.push({ parts });

    // API Call to Gemini 1.5 Flash
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        }
    );

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;

    // Clean up markdown if the AI added it (```json ... ```)
    const jsonString = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonString);
};
