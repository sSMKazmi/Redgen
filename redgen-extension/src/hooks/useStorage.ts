import { useState, useEffect } from 'react';
import { Listing, AppSettings } from '../types';

export const useStorage = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [settings, setSettings] = useState<AppSettings>({ apiKey: '' });
    const [loading, setLoading] = useState(true);

    // Load data on startup
    useEffect(() => {
        chrome.storage.local.get(['listings', 'settings'], (result) => {
            if (result.listings) setListings(result.listings);
            if (result.settings) setSettings(result.settings);
            setLoading(false);
        });
    }, []);

    // Helper: Save Listings
    const saveListings = (newListings: Listing[]) => {
        setListings(newListings);
        chrome.storage.local.set({ listings: newListings });
    };

    // Helper: Save Settings
    const saveSettings = (newSettings: AppSettings) => {
        setSettings(newSettings);
        chrome.storage.local.set({ settings: newSettings });
    };

    // Helper: Add New Listing
    const addListing = () => {
        const newListing: Listing = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            title: 'New Design Project',
            imagePreview: null,
            customContext: '',
            preservedTags: '',
            scrapedData: { title: '', tags: '', description: '' },
            generatedData: { title: '', tags: '', description: '' },
            isExpanded: true
        };
        saveListings([newListing, ...listings]);
    };

    // Helper: Update a specific listing
    const updateListing = (id: string, updates: Partial<Listing>) => {
        const updated = listings.map(l => l.id === id ? { ...l, ...updates } : l);
        saveListings(updated);
    };

    // Helper: Delete listing
    const deleteListing = (id: string) => {
        saveListings(listings.filter(l => l.id !== id));
    };

    return {
        listings,
        settings,
        loading,
        saveSettings,
        addListing,
        updateListing,
        deleteListing
    };
};
