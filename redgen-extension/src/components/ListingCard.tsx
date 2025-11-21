// src/components/ListingCard.tsx
import React, { useState, useEffect } from 'react';
import { generateMetadata } from '../utils/gemini-api';
import { Listing, AppSettings } from '../types';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Upload, Download, GripHorizontal } from 'lucide-react';

interface Props {
    listing: Listing;
    settings: AppSettings;
    onUpdate: (id: string, data: Partial<Listing>) => void;
    onDelete: (id: string) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, settings, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'original' | 'optimized'>('optimized');
    const [isGenerating, setIsGenerating] = useState(false);

    // --- SYNC LOGIC ---
    useEffect(() => {
        // If optimized data is empty, pre-fill it with scraped data so the user has a starting point
        if (!listing.generatedData.title && listing.scrapedData.title) {
            onUpdate(listing.id, { generatedData: listing.scrapedData });
        }
    }, [listing.scrapedData]);

    // --- HELPERS ---
    const currentData = activeTab === 'optimized' ? listing.generatedData : listing.scrapedData;

    const updateField = (field: 'title' | 'tags' | 'description', value: string) => {
        if (activeTab === 'optimized') {
            onUpdate(listing.id, { generatedData: { ...listing.generatedData, [field]: value } });
        } else {
            onUpdate(listing.id, { scrapedData: { ...listing.scrapedData, [field]: value } });
        }
    };

    const handleDownloadImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!listing.imagePreview) return;
        const link = document.createElement('a');
        link.href = listing.imagePreview;
        link.download = `${listing.title || 'design'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- DRAG & DROP TAG LOGIC ---
    const parseTags = (tagString: string) => tagString.split(',').map(t => t.trim()).filter(Boolean);

    const handleTagDrop = (tag: string, target: 'main' | 'preserved') => {
        const mainTags = parseTags(currentData.tags);
        const preservedTags = parseTags(listing.preservedTags);

        // Remove from both lists first (clean up)
        const newMain = mainTags.filter(t => t !== tag);
        const newPreserved = preservedTags.filter(t => t !== tag);

        // Add to target
        if (target === 'main') newMain.push(tag);
        else newPreserved.push(tag);

        // Update State
        updateField('tags', newMain.join(', '));
        onUpdate(listing.id, { preservedTags: newPreserved.join(', ') });
    };

    // --- API HANDLERS ---
    const handleScrape = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, (response) => {
            if (response && response.success) {
                onUpdate(listing.id, {
                    scrapedData: response.data,
                    generatedData: response.data,
                    title: response.data.title || "Scraped Product",
                    imagePreview: response.data.imagePreview
                });
            }
        });
    };

    const handleOptimize = async () => {
        if (!settings.apiKey) return alert("Add API Key in Settings!");
        setIsGenerating(true);
        try {
            let img = listing.imagePreview;
            // Simple check if url needs fetch (omitted for brevity, assuming base64 or public url works)
            const result = await generateMetadata(settings, img, listing.generatedData);
            onUpdate(listing.id, { generatedData: result });
            setActiveTab('optimized');
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutofill = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;
        const finalTags = [listing.preservedTags, currentData.tags].filter(Boolean).join(', ');
        chrome.tabs.sendMessage(tab.id, {
            type: 'FILL_FORM',
            payload: { ...currentData, tags: finalTags }
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg mb-3 shadow-sm overflow-hidden transition-all">

            {/* HEADER */}
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer select-none"
                onClick={() => onUpdate(listing.id, { isExpanded: !listing.isExpanded })}>
                <div className="flex items-center gap-3 overflow-hidden">
                    {listing.imagePreview ? (
                        <img src={listing.imagePreview} className="w-10 h-10 object-cover rounded border border-slate-200" />
                    ) : <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center"><Upload size={16} /></div>}
                    <span className="font-bold text-sm text-slate-700 truncate">{listing.title}</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(listing.id) }} className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"><Trash2 size={15} /></button>
                    {listing.isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {/* CONTENT */}
            {listing.isExpanded && (
                <div className="p-3">

                    {/* IMAGE PREVIEW & DOWNLOAD */}
                    {listing.imagePreview && (
                        <div className="relative mb-4 group">
                            <img src={listing.imagePreview} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                            <button
                                onClick={handleDownloadImage}
                                className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Download Image"
                            >
                                <Download size={14} />
                            </button>
                        </div>
                    )}

                    {/* TABS */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button onClick={() => setActiveTab('original')}
                            className={`flex-1 py-1 text-xs font-bold rounded ${activeTab === 'original' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                            ORIGINAL
                        </button>
                        <button onClick={() => setActiveTab('optimized')}
                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${activeTab === 'optimized' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>
                            <Sparkles size={10} /> OPTIMIZED
                        </button>
                    </div>

                    <div className="space-y-3">
                        {/* TITLE */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                            <input className="w-full text-xs p-2 border rounded"
                                value={currentData.title} onChange={e => updateField('title', e.target.value)} />
                        </div>

                        {/* DESCRIPTION */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                            <textarea className="w-full text-xs p-2 border rounded resize-none" rows={2}
                                value={currentData.description} onChange={e => updateField('description', e.target.value)} />
                        </div>

                        {/* --- DRAG & DROP TAG SYSTEM --- */}
                        <div className="bg-slate-50 p-2 rounded border border-slate-200">
                            <label className="text-[10px] font-bold text-indigo-500 uppercase mb-1 block">Active Tags (Drag to Move)</label>
                            <div className="flex flex-wrap gap-1 mb-3 min-h-[30px]"
                                onDragOver={e => e.preventDefault()}
                                onDrop={(e) => {
                                    const tag = e.dataTransfer.getData("tag");
                                    if (tag) handleTagDrop(tag, 'main');
                                }}>
                                {parseTags(currentData.tags).map(tag => (
                                    <span key={tag} draggable
                                        onDragStart={(e) => e.dataTransfer.setData("tag", tag)}
                                        className="bg-white border border-slate-300 text-slate-700 text-[10px] px-2 py-1 rounded-full cursor-move flex items-center gap-1 hover:border-indigo-400">
                                        <GripHorizontal size={8} className="text-slate-300" /> {tag}
                                    </span>
                                ))}
                                {parseTags(currentData.tags).length === 0 && <span className="text-xs text-slate-400 italic">No tags...</span>}
                            </div>

                            <div className="border-t border-slate-200 my-2"></div>

                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">🔒 Preserved Tags</label>
                            <div className="flex flex-wrap gap-1 min-h-[30px] bg-slate-100 rounded p-1"
                                onDragOver={e => e.preventDefault()}
                                onDrop={(e) => {
                                    const tag = e.dataTransfer.getData("tag");
                                    if (tag) handleTagDrop(tag, 'preserved');
                                }}>
                                {parseTags(listing.preservedTags).map(tag => (
                                    <span key={tag} draggable
                                        onDragStart={(e) => e.dataTransfer.setData("tag", tag)}
                                        className="bg-slate-200 border border-slate-300 text-slate-600 text-[10px] px-2 py-1 rounded-full cursor-move flex items-center gap-1">
                                        <GripHorizontal size={8} className="text-slate-400" /> {tag}
                                    </span>
                                ))}
                                {parseTags(listing.preservedTags).length === 0 && <span className="text-xs text-slate-400 italic">Drag tags here to preserve...</span>}
                            </div>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="mt-4 flex gap-2">
                        <button onClick={handleScrape} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded text-xs font-bold hover:bg-gray-200">
                            GRAB INFO
                        </button>
                        <button onClick={handleOptimize} disabled={isGenerating} className="flex-1 bg-slate-800 text-white py-2 rounded text-xs font-bold hover:bg-slate-900">
                            {isGenerating ? 'AI...' : 'OPTIMIZE'}
                        </button>
                        <button onClick={handleAutofill} className="flex-1 bg-red-500 text-white py-2 rounded text-xs font-bold hover:bg-red-600">
                            AUTOFILL
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};
