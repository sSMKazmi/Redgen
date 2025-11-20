import React from 'react';
import { Listing } from '../types';
import { Trash2, ChevronDown, ChevronUp, Sparkles, Upload } from 'lucide-react';

interface Props {
    listing: Listing;
    onUpdate: (id: string, data: Partial<Listing>) => void;
    onDelete: (id: string) => void;
}

export const ListingCard: React.FC<Props> = ({ listing, onUpdate, onDelete }) => {

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

                    {/* Generate Button (Mock for now) */}
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded text-xs font-bold hover:bg-slate-800 transition">
                        <Sparkles size={14} className="text-yellow-400" />
                        GENERATE METADATA
                    </button>

                </div>
            )}
        </div>
    );
};
