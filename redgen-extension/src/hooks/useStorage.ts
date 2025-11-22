import { useState, useEffect } from 'react';
import { Listing, AppSettings } from '../types';

export const useStorage = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ apiKey: '', titlePrompt: '', tagsPrompt: '', descPrompt: '' });
    const [loading, setLoading] = useState(true);

    const migrateListings = (rawListings: any[]) => {
        return rawListings.map((l: any) => {
            // 1. Migrate Tags (String -> Object)
            if (typeof l.generatedData.tags === 'string') {
                l.generatedData.tags = l.generatedData.tags.split(',').filter(Boolean).map((t: string) => ({ text: t.trim(), riskScore: 1 }));
            }
            // 2. Migrate Risk Score (String -> Number)
            else if (Array.isArray(l.generatedData.tags)) {
                l.generatedData.tags = l.generatedData.tags.map((t: any) => {
                    if (t.riskScore !== undefined) return t;
                    let score = 1;
                    if (t.risk === 'danger') score = 5;
                    else if (t.risk === 'caution') score = 3;
                    return { text: t.text, riskScore: score };
                });
            }

            // 3. MIGRATE IMAGES (Single String -> Array)
            if (!l.images) {
                l.images = l.imagePreview ? [l.imagePreview] : [];
            }

            return l;
        });
    };

    useEffect(() => {
        // 1. Initial Load
        chrome.storage.local.get(['listings', 'settings'], (result) => {
            if (result.listings) {
                setListings(migrateListings(result.listings));
            }
            if (result.settings) setSettings(result.settings);
            setLoading(false);
        });

        // 2. LIVE UPDATES LISTENER
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
            if (areaName === 'local' && changes.listings) {
                console.log('🔄 Storage changed, updating UI...');
                // APPLY MIGRATION TO LIVE UPDATES TOO
                setListings(migrateListings(changes.listings.newValue || []));
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        // Cleanup
        return () => {
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
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
            images: [], // New Array
            customContext: '',
            preservedTags: '',
            scrapedData: { title: '', tags: '', description: '' },
            generatedData: { title: '', tags: [], description: '' },
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
