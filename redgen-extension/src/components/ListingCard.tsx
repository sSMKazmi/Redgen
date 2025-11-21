import React, { useState, useEffect } from 'react';
import { generateMetadata, OptimizedResult } from '../utils/gemini-api';
import { Listing, AppSettings, TagItem } from '../types';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Upload, Download, GripHorizontal, X, Plus, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';

interface Props {
    listing: Listing;
    settings: AppSettings;
    onUpdate: (id: string, data: Partial<Listing>) => void;
    onDelete: (id: string) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, settings, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState<'original' | 'optimized'>('optimized');
    const [isGenerating, setIsGenerating] = useState(false);

    // Temporary inputs
    const [newTagInput, setNewTagInput] = useState('');
    const [newPreservedInput, setNewPreservedInput] = useState('');

    // --- SYNC & INIT LOGIC ---
    useEffect(() => {
        // If optimized data is empty/fresh, convert scraped string to tag objects
        if (!listing.generatedData.title && listing.scrapedData.title) {
            const initialTags: TagItem[] = listing.scrapedData.tags
                ? listing.scrapedData.tags.split(',').map(t => ({ text: t.trim(), riskScore: 1 }))
                : [];

            onUpdate(listing.id, {
                generatedData: {
                    title: listing.scrapedData.title,
                    description: listing.scrapedData.description,
                    tags: initialTags
                }
            });
        }
    }, [listing.scrapedData]);

    // --- HELPERS ---
    const isEditable = activeTab === 'optimized';

    // --- TAG MANAGER LOGIC (STRICT & COLORFUL) ---

    const parsePreserved = (str: string) => str.split(',').map(t => t.trim()).filter(Boolean);

    // Helper to get color based on risk score (1-5)
    const getTagColor = (score: number) => {
        switch (score) {
            case 5: return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'; // Danger
            case 4: return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200'; // High Risk
            case 3: return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'; // Caution
            case 2: return 'bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200'; // Low Risk
            case 1:
            default: return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'; // Safe
        }
    };

    const addTag = (tagText: string, target: 'main' | 'preserved', riskScore: number = 1) => {
        const cleanTag = tagText.trim();
        if (!cleanTag) return;

        let mainTags = [...listing.generatedData.tags];
        let preservedTags = parsePreserved(listing.preservedTags);

        // 1. STRICT REMOVAL: Remove from BOTH lists first
        mainTags = mainTags.filter(t => t.text !== cleanTag);
        preservedTags = preservedTags.filter(t => t !== cleanTag);

        // 2. ADD TO TARGET
        if (target === 'main') {
            mainTags.push({ text: cleanTag, riskScore });
        } else {
            preservedTags.push(cleanTag);
        }

        // 3. UPDATE STATE
        onUpdate(listing.id, {
            generatedData: { ...listing.generatedData, tags: mainTags },
            preservedTags: preservedTags.join(', ')
        });
    };

    const removeTag = (tagText: string) => {
        const mainTags = listing.generatedData.tags.filter(t => t.text !== tagText);
        const preservedTags = parsePreserved(listing.preservedTags).filter(t => t !== tagText);

        onUpdate(listing.id, {
            generatedData: { ...listing.generatedData, tags: mainTags },
            preservedTags: preservedTags.join(', ')
        });
    };

    const handleTagDrop = (tagText: string, target: 'main' | 'preserved') => {
        // Find existing risk if moving from main to preserved and back, or default to safe (1)
        const existing = listing.generatedData.tags.find(t => t.text === tagText);
        addTag(tagText, target, existing?.riskScore || 1);
    };

    // --- API HANDLERS ---
    const handleScrape = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.id) return;
        chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' }, (response) => {
            if (response && response.success) {
                // Convert scraped string tags to objects (Default risk 1)
                const scrapedTagObjects: TagItem[] = response.data.tags.split(',').map((t: string) => ({ text: t.trim(), riskScore: 1 }));

                onUpdate(listing.id, {
                    scrapedData: response.data,
                    generatedData: { ...response.data, tags: scrapedTagObjects },
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
            // Format current data for API (convert object tags back to string for the prompt context)
            const tagsString = listing.generatedData.tags.map(t => t.text).join(', ');
            const apiInput = { ...listing.generatedData, tags: tagsString };

            let img = listing.imagePreview;

            const result: OptimizedResult = await generateMetadata(settings, img, apiInput);

            // Result comes back as { title, desc, tags: [{text, riskScore}, ...] }
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

        // Join Preserved + Active Tags for final output string
        const activeTagStrings = listing.generatedData.tags.map(t => t.text);
        const preservedList = parsePreserved(listing.preservedTags);
        const finalTags = [...preservedList, ...activeTagStrings].filter(Boolean).join(', ');

        const payload = {
            title: listing.generatedData.title,
            description: listing.generatedData.description,
            tags: finalTags
        };

        chrome.tabs.sendMessage(tab.id, { type: 'FILL_FORM', payload });
    };

    const handleDownloadImage = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!listing.imagePreview) return;
        try {
            const response = await fetch(listing.imagePreview);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${listing.title || 'design'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            const link = document.createElement('a');
            link.href = listing.imagePreview;
            link.download = `${listing.title || 'design'}.png`;
            link.click();
        }
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

                    {/* MAIN FORM */}
                    <div className="space-y-4">

                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Title</label>
                            <input className="w-full text-xs p-2 border rounded disabled:bg-slate-50 disabled:text-slate-500"
                                disabled={!isEditable}
                                value={isEditable ? listing.generatedData.title : listing.scrapedData.title}
                                onChange={e => onUpdate(listing.id, { generatedData: { ...listing.generatedData, title: e.target.value } })} />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Description</label>
                            <textarea className="w-full text-xs p-2 border rounded resize-none disabled:bg-slate-50 disabled:text-slate-500" rows={3}
                                disabled={!isEditable}
                                value={isEditable ? listing.generatedData.description : listing.scrapedData.description}
                                onChange={e => onUpdate(listing.id, { generatedData: { ...listing.generatedData, description: e.target.value } })} />
                        </div>

                        {/* TAG MANAGER */}
                        {isEditable ? (
                            <div className="space-y-3">

                                {/* Preserved Zone */}
                                <div className="bg-indigo-50 p-2 rounded border border-indigo-100"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { const tag = e.dataTransfer.getData("tag"); if (tag) handleTagDrop(tag, 'preserved'); }}>
                                    <label className="text-[10px] font-bold text-indigo-600 uppercase mb-1 flex items-center gap-1">
                                        <ShieldCheck size={10} /> Preserved Tags <span className="font-normal lowercase opacity-70">(First priority)</span>
                                    </label>

                                    <div className="flex flex-wrap gap-1">
                                        {parsePreserved(listing.preservedTags).map(tag => (
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

                                {/* Active Zone with Risk Colors */}
                                <div className="bg-slate-50 p-2 rounded border border-slate-200"
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => { const tag = e.dataTransfer.getData("tag"); if (tag) handleTagDrop(tag, 'main'); }}>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex justify-between">
                                        <span>Active Tags</span>
                                        <span className="flex gap-2 text-[9px] font-normal">
                                            <span className="text-red-600 flex items-center gap-0.5">
                                                <ShieldAlert size={8} /> {listing.generatedData.tags.filter(t => t.riskScore >= 3).length} Risk
                                            </span>
                                            <span className="text-emerald-600 flex items-center gap-0.5">
                                                <ShieldCheck size={8} /> {listing.generatedData.tags.filter(t => t.riskScore < 3).length} Safe
                                            </span>
                                        </span>
                                    </label>

                                    <div className="flex flex-wrap gap-1">
                                        {listing.generatedData.tags.map(tagObj => (
                                            <span key={tagObj.text} draggable onDragStart={e => e.dataTransfer.setData("tag", tagObj.text)}
                                                className={`${getTagColor(tagObj.riskScore)} border text-[10px] px-2 py-1 rounded-full cursor-move flex items-center gap-1 shadow-sm select-none transition-colors`}>
                                                <GripHorizontal size={8} className="opacity-50" /> {tagObj.text}
                                                <button onClick={() => removeTag(tagObj.text)} className="hover:text-red-600 opacity-60 hover:opacity-100"><X size={10} /></button>
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
                                    {listing.scrapedData.tags || "No tags grabbed."}
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
