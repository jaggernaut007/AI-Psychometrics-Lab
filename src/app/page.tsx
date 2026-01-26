"use client";

import React from 'react';
import { ConfigForm } from '../components/ConfigForm';
import { ResultsView } from '../components/ResultsView';
import { usePsychometrics } from '../hooks/usePsychometrics';
import { Activity, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
    const { isRunning, progress, totalItems, logs, results, runTest } = usePsychometrics();
    const [currentApiKey, setCurrentApiKey] = React.useState('');

    const handleStart = (apiKey: string, model: string, inventories: string[], persona: string, systemPrompt: string) => {
        setCurrentApiKey(apiKey);
        runTest(apiKey, model, inventories, persona, systemPrompt);
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
                        <img
                            src="/logo.png"
                            alt="AI Psychometrics Lab"
                            className="h-24 w-auto mx-auto drop-shadow-sm"
                        />
                    </Link>
                    <p className="text-lg text-gray-600 mt-4">
                        Stateless Independent Context Window Approach (SICWA)
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/explorer" className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-md hover:bg-indigo-50 font-medium shadow-sm transition text-center">
                            🧭 Model Explorer
                        </Link>
                        <Link href="/runs" className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 font-medium shadow-sm transition text-center">
                            ⏱ Recent Runs
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                    <ConfigForm onStart={handleStart} disabled={isRunning} />

                    {/* Progress Section */}
                    {(isRunning || logs.length > 0) && (
                        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                            <div className="flex items-center gap-2 mb-4 text-xl font-semibold text-gray-800">
                                <Activity className="w-6 h-6" />
                                <h2>Execution Status</h2>
                            </div>

                            {isRunning && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>Progress</span>
                                        <span>{Math.round((progress / totalItems) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${(progress / totalItems) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Processing item {progress} of {totalItems} (x5 samples)
                                    </p>
                                </div>
                            )}

                            <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded h-48 overflow-y-auto">
                                <div className="flex items-center gap-2 border-b border-gray-700 pb-2 mb-2 text-gray-400">
                                    <Terminal className="w-4 h-4" />
                                    <span>Console Output</span>
                                </div>
                                {logs.map((log, i) => (
                                    <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' :
                                        log.type === 'success' ? 'text-green-300' : 'text-gray-300'
                                        }`}>
                                        <span className="opacity-50 mr-2">[{log.timestamp}]</span>
                                        {log.message}
                                    </div>
                                ))}
                                {logs.length === 0 && <span className="text-gray-600">Waiting to start...</span>}
                            </div>
                        </div>
                    )}

                    {/* Results Section */}
                    {results && <ResultsView results={results} apiKey={currentApiKey} />}
                </div>
            </div>
        </main>
    );
}
