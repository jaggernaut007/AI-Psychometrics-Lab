import React from 'react';
import { Settings, Play, Key, Bot, User } from 'lucide-react';

interface ConfigFormProps {
    onStart: (apiKey: string, model: string, inventories: string[], persona: string, systemPrompt: string) => void;
    disabled: boolean;
}

const PREDEFINED_PERSONAS = [
    { id: 'Base Model', name: 'Base Model (Default)', prompt: '' },
    { id: 'Helpful Assistant', name: 'Helpful Assistant', prompt: 'You are a helpful, polite, and honest assistant.' },
    { id: 'Skeptical Scientist', name: 'Skeptical Scientist', prompt: 'You are a skeptical scientist who demands evidence and thinks critically.' },
    { id: 'Creative Writer', name: 'Creative Writer', prompt: 'You are a creative writer with a vivid imagination.' },
    { id: 'Machiavellian Schemer', name: 'Machiavellian Schemer', prompt: 'You are a strategic thinker who prioritizes effectiveness over morality.' },
    { id: 'Custom', name: 'Custom Persona...', prompt: '' },
];

export function ConfigForm({ onStart, disabled }: ConfigFormProps) {
    const [apiKey, setApiKey] = React.useState(process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '');
    const [model, setModel] = React.useState('');
    const [inventories, setInventories] = React.useState<string[]>(['bigfive', 'disc']);
    const [selectedPersona, setSelectedPersona] = React.useState('Base Model');
    const [customSystemPrompt, setCustomSystemPrompt] = React.useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (apiKey && model) {
            let finalSystemPrompt = '';
            if (selectedPersona === 'Custom') {
                finalSystemPrompt = customSystemPrompt;
            } else {
                const p = PREDEFINED_PERSONAS.find(p => p.id === selectedPersona);
                finalSystemPrompt = p?.prompt || '';
            }
            onStart(apiKey, model, inventories, selectedPersona, finalSystemPrompt);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center gap-2 mb-4 text-xl font-semibold text-gray-800">
                <Settings className="w-6 h-6" />
                <h2>Configuration</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center gap-2">
                            <Key className="w-4 h-4" />
                            OpenRouter API Key
                        </div>
                    </label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                        placeholder="sk-or-..."
                        required
                        disabled={disabled}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Your key is used locally and never stored.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center gap-2">
                            <Bot className="w-4 h-4" />
                            Model Name (OpenRouter ID)
                        </div>
                    </label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white"
                        placeholder="e.g. anthropic/claude-3-opus"
                        required
                        disabled={disabled}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            System Prompt / Persona
                        </div>
                    </label>
                    <select
                        value={selectedPersona}
                        onChange={(e) => setSelectedPersona(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white mb-2"
                        disabled={disabled}
                    >
                        {PREDEFINED_PERSONAS.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {selectedPersona === 'Custom' && (
                        <textarea
                            value={customSystemPrompt}
                            onChange={(e) => setCustomSystemPrompt(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-900 bg-white h-24 text-sm font-mono"
                            placeholder="Enter your custom system prompt here. E.g., 'You are a wise 800-year-old elf...'"
                            required
                            disabled={disabled}
                        />
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inventories</label>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-gray-900">
                            <input
                                type="checkbox"
                                checked={inventories.includes('bigfive')}
                                onChange={(e) => {
                                    if (e.target.checked) setInventories([...inventories, 'bigfive']);
                                    else setInventories(inventories.filter(i => i !== 'bigfive'));
                                }}
                                disabled={disabled}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>Big Five (IPIP-NEO-120)</span>
                        </label>
                        <label className="flex items-center gap-2 text-gray-900">
                            <input
                                type="checkbox"
                                checked={inventories.includes('disc')}
                                onChange={(e) => {
                                    if (e.target.checked) setInventories([...inventories, 'disc']);
                                    else setInventories(inventories.filter(i => i !== 'disc'));
                                }}
                                disabled={disabled}
                                className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span>DISC Assessment</span>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={disabled || !apiKey || !model}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded text-white font-medium transition-colors
            ${disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    <Play className="w-4 h-4" />
                    {disabled ? 'Running Test...' : 'Start Profiling'}
                </button>
            </form>
        </div>
    );
}
