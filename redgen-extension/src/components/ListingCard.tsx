import React from 'react';
import { generateMetadata } from '../utils/gemini-api';
import { Listing, AppSettings } from '../types'; // Make sure you have this
import { Trash2, ChevronDown, ChevronUp, Sparkles, Upload } from 'lucide-react';

interface Props {
    listing: Listing;
    settings: AppSettings; // <--- NEW
    onUpdate: (id: string, data: Partial<Listing>) => void;
    onDelete: (id: string) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, settings, onUpdate, onDelete }) => {
    const [isGenerating, setIsGenerating] = React.useState(false); // Local loading state

    // Handle Image Upload (Manual)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdate(listing.id, { imagePreview: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScrape = async () => {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, (response) => {
            if (response && response.success) {
                onUpdate(listing.id, { scrapedData: response.data });
            }
        });
    };

    const handleAutofill = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        // Combine Preserved + Generated Tags
        const finalTags = [listing.preservedTags, listing.generatedData.tags]
            .filter(Boolean)
            .join(', ');

        const payload = {
            title: listing.generatedData.title || listing.scrapedData.title,
            description: listing.generatedData.description || listing.scrapedData.description,
            tags: finalTags
        };

        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', payload });
    };

    const handleGenerate = async () => {
        if (!settings.apiKey) {
            alert("Please enter your Gemini API Key in Settings first!");
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateMetadata(
                settings.apiKey,
                listing.imagePreview, // Using the preview as the source
                listing.customContext,
                listing.scrapedData
            );

            onUpdate(listing.id, {
                generatedData: {
                    title: result.title,
                    tags: result.tags,
                    description: result.description
                }
            });
        } catch (error: any) {
            alert("Generation Failed: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg mb-3 shadow-sm overflow-hidden">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer select-none"
                onClick={() => onUpdate(listing.id, { isExpanded: !listing.isExpanded })}>
                <div className="flex items-center gap-3">
                    {listing.imagePreview ? (
                        <img src={listing.imagePreview} className="w-10 h-10 object-cover rounded bg-slate-200" />
                    ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center text-slate-400">
                            <Upload size={16} />
                        </div>
                    )}
                    <span className="font-semibold text-sm text-slate-700 truncate max-w-[140px]">
                        {listing.title}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(listing.id); }}
                        className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded">
                        <Trash2 size={16} />
                    </button>
                    {listing.isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* Expanded Content */}
            {listing.isExpanded && (
                <div className="p-3 space-y-4">

                    {/* Image Input */}
                    {!listing.imagePreview && (
                        <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center hover:bg-slate-50 transition">
                            <label className="cursor-pointer block w-full h-full">
                                <span className="text-xs text-slate-500 font-medium">Click to Upload Art</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            </label>
                        </div>
                    )}

                    {/* Action Row: Scrape */}
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handleScrape}
                            className="flex-1 bg-indigo-50 text-indigo-600 border border-indigo-200 py-2 rounded text-xs font-bold hover:bg-indigo-100 transition"
                        >
                            👇 GRAB INFO FROM PAGE
                        </button>
                    </div>

                    {/* Inputs Section */}
                    <div className="space-y-2">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Custom Context</label>
                            <textarea
                                className="w-full text-xs p-2 border rounded focus:ring-1 ring-red-400 outline-none resize-none"
                                rows={2}
                                placeholder="e.g. Make tags funny, target Halloween..."
                                value={listing.customContext}
                                onChange={(e) => onUpdate(listing.id, { customContext: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preserved Tags</label>
                            <input
                                type="text"
                                className="w-full text-xs p-2 border rounded focus:ring-1 ring-red-400 outline-none"
                                placeholder="MyBrand, SeriesName..."
                                value={listing.preservedTags}
                                onChange={(e) => onUpdate(listing.id, { preservedTags: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded text-xs font-bold transition text-white
    ${isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                    >
                        {isGenerating ? (
                            <span>Generating...</span>
                        ) : (
                            <>
                                <Sparkles size={14} className="text-yellow-400" />
                                GENERATE METADATA
                            </>
                        )}
                    </button>

                    {/* Display Results if they exist */}
                    {listing.generatedData.title && (
                        <div className="mt-3 space-y-2 bg-green-50 p-3 rounded border border-green-100">
                            <div>
                                <label className="text-[10px] font-bold text-green-700">GENERATED TITLE</label>
                                <input
                                    className="w-full text-xs p-1 border rounded"
                                    value={listing.generatedData.title}
                                    onChange={(e) => onUpdate(listing.id, { generatedData: { ...listing.generatedData, title: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-green-700">GENERATED TAGS</label>
                                <textarea
                                    className="w-full text-xs p-1 border rounded"
                                    rows={3}
                                    value={listing.generatedData.tags}
                                    onChange={(e) => onUpdate(listing.id, { generatedData: { ...listing.generatedData, tags: e.target.value } })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-green-700">GENERATED DESC</label>
                                <textarea
                                    className="w-full text-xs p-1 border rounded"
                                    rows={3}
                                    value={listing.generatedData.description}
                                    onChange={(e) => onUpdate(listing.id, { generatedData: { ...listing.generatedData, description: e.target.value } })}
                                />
                            </div>
                        </div>
                    )}

                    {/* Add Autofill Button at the bottom */}
                    <button
                        onClick={handleAutofill}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-red-500 text-white py-2 rounded text-xs font-bold hover:bg-red-600 transition"
                    >
                        🚀 AUTOFILL REDBUBBLE
                    </button>

                </div>
            )}
        </div>
    );
};
