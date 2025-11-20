import React, { useState } from 'react';
import { Settings as SettingsIcon, Plus } from 'lucide-react';
import { useStorage } from './hooks/useStorage';
import { ListingCard } from './components/ListingCard';
import { Settings } from './components/Settings';

function App() {
    const { listings, settings, loading, addListing, updateListing, deleteListing, saveSettings } = useStorage();
    const [showSettings, setShowSettings] = useState(false);

    if (loading) return <div className="p-4 text-xs text-slate-500">Loading storage...</div>;

    return (
        <div className="w-full min-h-screen bg-gray-50 font-sans pb-10">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <h1 className="font-bold text-slate-800">RedGen</h1>
                </div>
                <button onClick={() => setShowSettings(!showSettings)} className="text-slate-400 hover:text-slate-700 transition">
                    <SettingsIcon size={20} />
                </button>
            </header>

            {/* Settings Drawer */}
            {showSettings && (
                <Settings
                    settings={settings}
                    onSave={saveSettings}
                    onClose={() => setShowSettings(false)}
                />
            )}

            {/* Main Content */}
            <main className="p-4">
                {/* Action Bar */}
                <button
                    onClick={addListing}
                    className="w-full mb-4 flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 rounded-lg p-3 text-slate-500 hover:border-red-400 hover:text-red-500 transition bg-white"
                >
                    <Plus size={18} />
                    <span className="text-sm font-medium">New Project</span>
                </button>

                {/* List of Listings */}
                {listings.length === 0 ? (
                    <div className="text-center text-slate-400 text-xs mt-10">
                        No active projects.<br />Click above to start.
                    </div>
                ) : (
                    listings.map(listing => (
                        <ListingCard
                            key={listing.id}
                            listing={listing}
                            onUpdate={updateListing}
                            onDelete={deleteListing}
                        />
                    ))
                )}
            </main>
        </div>
    );
}

export default App;
