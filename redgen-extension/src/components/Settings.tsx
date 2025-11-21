// src/components/Settings.tsx
import React from 'react';
import { AppSettings } from '../types';
import { Key, Save, FileText, Tag, Type } from 'lucide-react';

interface Props {
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
    onClose: () => void;
}

// --- DEFAULTS BASED ON YOUR REDBUBBLE 101 TEXT ---
const DEFAULT_TITLE_PROMPT = `Create a catchy, SEO-friendly title (Max 60 chars). Focus on subject, style, and medium.`;
const DEFAULT_DESC_PROMPT = `Write a persuasive description (2-3 sentences). Include keywords for Google SEO. Focus on the design's theme and emotion.`;
const DEFAULT_TAGS_PROMPT = `RED BUBBLE TAGGING RULES:
1. Use 15-20 tags.
2. Focus on: Content (flower, tree), Theme (nature, zen), Style (watercolor).
3. AVOID: Generic words (art, image), Spam (best selling, trending), Repetition (dog, dogs).
4. Use Synonyms (Celestial for Starry).
5. Format: Single words or short phrases, comma-separated.`;

export const Settings: React.FC<Props> = ({ settings, onSave, onClose }) => {
    const [apiKey, setApiKey] = React.useState(settings.apiKey || '');
    const [titlePrompt, setTitlePrompt] = React.useState(settings.titlePrompt || DEFAULT_TITLE_PROMPT);
    const [tagsPrompt, setTagsPrompt] = React.useState(settings.tagsPrompt || DEFAULT_TAGS_PROMPT);
    const [descPrompt, setDescPrompt] = React.useState(settings.descPrompt || DEFAULT_DESC_PROMPT);

    const handleSave = () => {
        onSave({ apiKey, titlePrompt, tagsPrompt, descPrompt });
        onClose();
    };

    return (
        <div className="p-4 bg-slate-50 border-b border-slate-200 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-700 flex items-center gap-2">
                    <Key size={18} /> Configuration
                </h2>
                <button onClick={onClose} className="text-xs text-slate-500">Close</button>
            </div>

            <div className="space-y-5">
                {/* API Key */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gemini API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full p-2 border rounded text-sm outline-none focus:border-red-400"
                        placeholder="Paste Key..."
                    />
                </div>

                {/* Master Prompts */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Type size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Master Title Instruction</span>
                    </div>
                    <textarea
                        value={titlePrompt}
                        onChange={(e) => setTitlePrompt(e.target.value)}
                        className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-indigo-400"
                    />
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Tag size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Master Tags Instruction</span>
                    </div>
                    <textarea
                        value={tagsPrompt}
                        onChange={(e) => setTagsPrompt(e.target.value)}
                        className="w-full p-2 border rounded text-xs h-32 outline-none focus:border-indigo-400"
                    />
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <FileText size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Master Description Instruction</span>
                    </div>
                    <textarea
                        value={descPrompt}
                        onChange={(e) => setDescPrompt(e.target.value)}
                        className="w-full p-2 border rounded text-xs h-20 outline-none focus:border-indigo-400"
                    />
                </div>

                <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded text-sm font-bold hover:bg-red-600"
                >
                    <Save size={16} /> Save Settings
                </button>
            </div>
        </div>
    );
};
