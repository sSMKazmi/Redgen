import { useState, useEffect } from 'react';
import { Listing, AppSettings, TagItem } from '../types';

export const useStorage = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ apiKey: '', titlePrompt: '', tagsPrompt: '', descPrompt: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.storage.local.get(['listings', 'settings'], (result) => {
            if (result.listings) {
                // MIGRATION: Fix old string tags to object tags
                const migratedListings = result.listings.map((l: any) => {
                    if (typeof l.generatedData.tags === 'string') {
                        l.generatedData.tags = l.generatedData.tags.split(',').filter(Boolean).map((t: string) => ({ text: t.trim(), risk: 'safe' }));
                    }
                    return l;
                });
                setListings(migratedListings);
            }
            if (result.settings) setSettings(result.settings);
            setLoading(false);
        });
    }, []);

    const saveListings = (newListings: Listing[]) => {
        setListings(newListings);
        chrome.storage.local.set({ listings: newListings });
    };

    const saveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        chrome.storage.local.set({ settings: newSettings });
    };

    const addListing = () => {
        const newListing: Listing = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            title: 'New Design Project',
            imagePreview: null,
            customContext: '',
            preservedTags: '',
            scrapedData: { title: '', tags: '', description: '' },
            generatedData: { title: '', tags: [], description: '' }, // Empty array for tags
            isExpanded: true
        };
        saveListings([newListing, ...listings]);
    };

    const updateListing = (id: string, updates: Partial<Listing>) => {
        const updated = listings.map(l => l.id === id ? { ...l, ...updates } : l);
        saveListings(updated);
    };

    const deleteListing = (id: string) => {
        saveListings(listings.filter(l => l.id !== id));
    };

    return { listings, settings, loading, saveSettings, addListing, updateListing, deleteListing };
};
