import React, { useState, useEffect } from 'react';
import { generateMetadata } from '../utils/gemini-api';
import { Listing, AppSettings } from '../types';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Upload, Download, GripHorizontal, X, Plus } from 'lucide-react';

interface Props {
    listing: Listing;
    settings: AppSettings;
    onUpdate: (id: string, data: Partial<Listing>) => void;
    onDelete: (id: string) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, settings, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'original' | 'optimized'>('optimized');
    const [isGenerating, setIsGenerating] = useState(false);

    // Temporary input state for adding tags
    const [newTagInput, setNewTagInput] = useState('');
    const [newPreservedInput, setNewPreservedInput] = useState('');

    // --- SYNC LOGIC ---
    useEffect(() => {
        // Initialize optimized data with scraped data if empty, so user isn't staring at blanks
        if (!listing.generatedData.title && listing.scrapedData.title) {
            onUpdate(listing.id, { generatedData: listing.scrapedData });
        }
    }, [listing.scrapedData]);

    // --- HELPERS ---
    const currentData = activeTab === 'optimized' ? listing.generatedData : listing.scrapedData;
    // We only allow editing fields if we are in the 'optimized' tab
    const isEditable = activeTab === 'optimized';

    // Update helper
    const updateField = (field: 'title' | 'tags' | 'description', value: string) => {
        // Always update generatedData, regardless of tab, because Original is Read-Only reference
        onUpdate(listing.id, { generatedData: { ...listing.generatedData, [field]: value } });
    };

    // --- TAG MANAGER LOGIC (Strict Uniqueness) ---
    const parseTags = (tagStr: string) => tagStr.split(',').map(t => t.trim()).filter(Boolean);

    const updateTags = (main: string[], preserved: string[]) => {
        onUpdate(listing.id, {
            generatedData: { ...listing.generatedData, tags: main.join(', ') },
            preservedTags: preserved.join(', ')
        });
    };

    const addTag = (tag: string, target: 'main' | 'preserved') => {
        const cleanTag = tag.trim();
        if (!cleanTag) return;

        let mainTags = parseTags(listing.generatedData.tags);
        let preservedTags = parseTags(listing.preservedTags);

        // 1. Remove from BOTH lists first (Enforce Uniqueness / Move Logic)
        mainTags = mainTags.filter(t => t !== cleanTag);
        preservedTags = preservedTags.filter(t => t !== cleanTag);

        // 2. Add to Target
        if (target === 'main') mainTags.push(cleanTag);
        else preservedTags.push(cleanTag);

        updateTags(mainTags, preservedTags);
    };

    const removeTag = (tag: string) => {
        // Just filter it out from both to be safe
        const mainTags = parseTags(listing.generatedData.tags).filter(t => t !== tag);
        const preservedTags = parseTags(listing.preservedTags).filter(t => t !== tag);
        updateTags(mainTags, preservedTags);
    };

    const handleTagDrop = (tag: string, target: 'main' | 'preserved') => {
        // Same logic as addTag: remove from both, add to target
        addTag(tag, target);
    };

    // --- DOWNLOAD FIX ---
    const handleDownloadImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!listing.imagePreview) return;

        try {
            // Fetch blob to bypass cross-origin download restrictions
            const response = await fetch(listing.imagePreview);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${listing.title || 'redgen-design'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed", err);
            // Fallback for Base64 strings
            const link = document.createElement('a');
            link.href = listing.imagePreview;
            link.download = `${listing.title || 'redgen-design'}.png`;
            link.click();
        }
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
            // Always optimize using the Image + the DATA FROM THE ACTIVE INPUTS
            // If user is in 'Original' tab, we optimize based on Scraped Data
            // If user is in 'Optimized' tab, we re-optimize based on current edits
            const sourceData = activeTab === 'optimized' ? listing.generatedData : listing.scrapedData;

            const result = await generateMetadata(settings, listing.imagePreview, sourceData);

            onUpdate(listing.id, { generatedData: result });
            setActiveTab('optimized'); // Force switch to show results
        } catch (e: any) {
            alert("Error: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutofill = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;

        // AUTOFILL RULE: Always use Optimized Data + Preserved Tags
        const dataToFill = listing.generatedData;
        const finalTags = [listing.preservedTags, dataToFill.tags].filter(Boolean).join(', ');

        chrome.tabs.sendMessage(tab.id, {
            type: 'FILL_FORM',
            payload: { ...dataToFill, tags: finalTags }
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-lg mb-3 shadow-sm overflow-hidden transition-all">

            {/* HEADER */}
            <div className="flex items-center justify-between p-3 bg-slate-50 cursor-pointer select-none hover:bg-slate-100"
                onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.no-toggle')) return;
                    onUpdate(listing.id, { isExpanded: !listing.isExpanded });
                }}>
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {listing.imagePreview ? (
                        <img src={listing.imagePreview} className="w-10 h-10 object-cover rounded border border-slate-200" />
                    ) : <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center"><Upload size={16} /></div>}
                    <span className="font-bold text-sm text-slate-700 truncate max-w-[180px]">{listing.title}</span>
                </div>
                <div className="flex items-center gap-1 no-toggle">
                    <button onClick={(e) => { e.stopPropagation(); onDelete(listing.id) }} className="p-1 hover:bg-red-100 text-slate-400 hover:text-red-500 rounded"><Trash2 size={15} /></button>
                    {listing.isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </div>

            {listing.isExpanded && (
                <div className="p-3">

                    {/* IMAGE AREA */}
                    {listing.imagePreview && (
                        <div className="relative mb-4 group">
                            <img src={listing.imagePreview} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                            <button onClick={handleDownloadImage}
                                className="absolute bottom-2 right-2 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-md transition-opacity">
                                <Download size={12} /> Download
                            </button>
                        </div>
                    )}

                    {/* TABS */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                        <button onClick={() => setActiveTab('original')}
                            className={`flex-1 py-1 text-xs font-bold rounded ${activeTab === 'original' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
                            ORIGINAL
                        </button>
                        <button onClick={() => setActiveTab('optimized')}
                            className={`flex-1 py-1 text-xs font-bold rounded flex items-center justify-center gap-1 ${activeTab === 'optimized' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
                            <Sparkles size={10} /> OPTIMIZED
                        </button>
                    </div>

                    {/* MAIN INPUTS */}
                    <div className="space-y-4">

                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                            <input className="w-full text-xs p-2 border rounded disabled:bg-slate-50 disabled:text-slate-500"
                                disabled={!isEditable}
                                value={currentData.title} onChange={e => updateField('title', e.target.value)} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                            <textarea className="w-full text-xs p-2 border rounded resize-none disabled:bg-slate-50 disabled:text-slate-500" rows={3}
                                disabled={!isEditable}
                                value={currentData.description} onChange={e => updateField('description', e.target.value)} />
                        </div>

                        {/* TAG MANAGER (Interactive in Optimized, Read-Only in Original) */}
                        {isEditable ? (
                            <div className="space-y-2">

                                {/* Preserved Zone */}
                                <div className="bg-indigo-50 p-2 rounded border border-indigo-100"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { const tag = e.dataTransfer.getData("tag"); if (tag) handleTagDrop(tag, 'preserved'); }}>
                                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 flex items-center gap-1">
                                        🔒 Preserved Tags <span className="font-normal lowercase opacity-70">(Always first)</span>
                                    </label>

                                    <div className="flex flex-wrap gap-1">
                                        {parseTags(listing.preservedTags).map(tag => (
                                            <span key={tag} draggable onDragStart={e => e.dataTransfer.setData("tag", tag)}
                                                className="bg-white border border-indigo-200 text-indigo-700 text-[10px] px-2 py-1 rounded-full cursor-move flex items-center gap-1 hover:border-indigo-400 shadow-sm select-none">
                                                <GripHorizontal size={8} className="opacity-50" /> {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-1 bg-white/50 border border-transparent hover:border-indigo-200 rounded px-1">
                                            <Plus size={10} className="text-indigo-400" />
                                            <input className="bg-transparent text-[10px] w-20 outline-none text-indigo-700 placeholder-indigo-300"
                                                placeholder="Add tag..."
                                                value={newPreservedInput}
                                                onChange={e => setNewPreservedInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { addTag(newPreservedInput, 'preserved'); setNewPreservedInput(''); } }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Zone */}
                                <div className="bg-slate-50 p-2 rounded border border-slate-200"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { const tag = e.dataTransfer.getData("tag"); if (tag) handleTagDrop(tag, 'main'); }}>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Active Tags</label>

                                    <div className="flex flex-wrap gap-1">
                                        {parseTags(currentData.tags).map(tag => (
                                            <span key={tag} draggable onDragStart={e => e.dataTransfer.setData("tag", tag)}
                                                className="bg-white border border-slate-300 text-slate-700 text-[10px] px-2 py-1 rounded-full cursor-move flex items-center gap-1 hover:border-slate-400 shadow-sm select-none">
                                                <GripHorizontal size={8} className="opacity-50" /> {tag}
                                                <button onClick={() => removeTag(tag)} className="hover:text-red-500"><X size={10} /></button>
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-1 bg-white/50 border border-transparent hover:border-slate-300 rounded px-1">
                                            <Plus size={10} className="text-slate-400" />
                                            <input className="bg-transparent text-[10px] w-20 outline-none text-slate-700 placeholder-slate-400"
                                                placeholder="Add tag..."
                                                value={newTagInput}
                                                onChange={e => setNewTagInput(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') { addTag(newTagInput, 'main'); setNewTagInput(''); } }} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            /* Read-Only Tags for Original Tab */
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Original Tags</label>
                                <div className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded text-xs text-slate-500 italic leading-relaxed">
                                    {currentData.tags || "No tags grabbed."}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* FOOTER ACTIONS - ALWAYS VISIBLE */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <button onClick={handleScrape} className="bg-gray-100 text-gray-600 py-2.5 rounded text-xs font-bold hover:bg-gray-200 border border-gray-200">
                            👇 GRAB INFO
                        </button>
                        <button onClick={handleOptimize} disabled={isGenerating} className="bg-slate-800 text-white py-2.5 rounded text-xs font-bold hover:bg-slate-900">
                            {isGenerating ? 'AI...' : '✨ OPTIMIZE'}
                        </button>
                        <button onClick={handleAutofill} className="bg-red-500 text-white py-2.5 rounded text-xs font-bold hover:bg-red-600 shadow-sm">
                            🚀 AUTOFILL
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};
