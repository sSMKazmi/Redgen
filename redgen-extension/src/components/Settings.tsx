import React from 'react';
import { AppSettings } from '../types';
import { Key, Save } from 'lucide-react';

interface Props {
    settings: AppSettings;
    onSave: (s: AppSettings) => void;
    onClose: () => void;
}

export const Settings: React.FC<Props> = ({ settings, onSave, onClose }) => {
    const [key, setKey] = React.useState(settings.apiKey);

    return (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-slate-700">
                <Key size={18} />
                <h2 className="font-bold">API Configuration</h2>
            </div>

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">GEMINI API KEY</label>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        className="w-full p-2 border rounded text-sm focus:ring-2 ring-red-400 outline-none"
                        placeholder="Paste your key here..."
                    />
                </div>

                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="text-xs px-3 py-2 text-slate-500 hover:text-slate-700">Cancel</button>
                    <button
                        onClick={() => { onSave({ apiKey: key }); onClose(); }}
                        className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded"
                    >
                        <Save size={14} /> Save
                    </button>
                </div>
            </div>
        </div>
    );
};
