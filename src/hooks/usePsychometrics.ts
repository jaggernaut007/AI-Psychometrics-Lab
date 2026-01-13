import { useState, useCallback, useEffect, useRef } from 'react';
import { fetchOpenRouterResponse } from '../lib/psychometrics/client';
import { BIG_FIVE_ITEMS, calculateBigFiveScores } from '../lib/psychometrics/inventories/bigfive';
import { MBTI_ITEMS, calculateMBTIScores, deriveMBTIFromBigFive } from '../lib/psychometrics/inventories/mbti';
import { DISC_ITEMS, calculateDISCScores } from '../lib/psychometrics/inventories/disc';
import { DARK_TRIAD_ITEMS, calculateDarkTriadScores } from '../lib/psychometrics/inventories/darktriad';
import { InventoryItem, ModelProfile } from '../lib/psychometrics/types';

export interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'success';
}

export function usePsychometrics() {
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [results, setResults] = useState<ModelProfile | null>(null);

    const logsBufferRef = useRef<LogEntry[]>([]);
    const allLogsRef = useRef<LogEntry[]>([]); // To store ALL logs for the final result
    const flushTimeoutRef = useRef<number | null>(null);

    const flushLogs = useCallback(() => {
        if (flushTimeoutRef.current) {
            window.clearTimeout(flushTimeoutRef.current);
            flushTimeoutRef.current = null;
        }
        if (logsBufferRef.current.length === 0) return;
        const buffered = logsBufferRef.current;
        logsBufferRef.current = [];
        setLogs((prev) => [...prev, ...buffered]);
    }, []);

    useEffect(() => {
        return () => {
            if (flushTimeoutRef.current) {
                window.clearTimeout(flushTimeoutRef.current);
                flushTimeoutRef.current = null;
            }
        };
    }, []);

    const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
        const entry: LogEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        logsBufferRef.current.push(entry);
        allLogsRef.current.push(entry); // Store in permanent buffer

        if (logsBufferRef.current.length >= 25) {
            flushLogs();
            return;
        }

        if (!flushTimeoutRef.current) {
            flushTimeoutRef.current = window.setTimeout(() => {
                flushLogs();
            }, 200);
        }
    }, [flushLogs]);

    const runTest = useCallback(async (
        apiKey: string,
        model: string,
        inventories: string[],
        persona: string = 'Base Model',
        systemPrompt: string = ''
    ) => {
        setIsRunning(true);
        setLogs([]);
        logsBufferRef.current = [];
        allLogsRef.current = []; // Clear permanent buffer
        setProgress(0);
        setResults(null);

        try {
            addLog(`Starting test for model: ${model} [${persona}]`, 'info');

            // Collect all items to run
            let allItems: InventoryItem[] = [];
            if (inventories.includes('bigfive')) {
                allItems = [...allItems, ...BIG_FIVE_ITEMS];
            }
            if (inventories.includes('disc')) {
                allItems = [...allItems, ...DISC_ITEMS];
            }
            if (inventories.includes('mbti')) {
                allItems = [...allItems, ...MBTI_ITEMS];
            }
            if (inventories.includes('darktriad')) {
                allItems = [...allItems, ...DARK_TRIAD_ITEMS];
            }

            setTotalItems(allItems.length);
            addLog(`Total items to query: ${allItems.length} (x5 samples = ${allItems.length * 5} requests)`, 'info');

            const rawScores: Record<string, number[]> = {};

            // Process items
            // We can parallelize this, but need to be careful with rate limits.
            // Let's do chunks of 3 items at a time to avoid rate limits and timeouts.
            const CHUNK_SIZE = 3;

            for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
                const chunk = allItems.slice(i, i + CHUNK_SIZE);

                await Promise.all(chunk.map(async (item) => {
                    const itemScores: number[] = [];

                    // 5 Samples per item
                    for (let sample = 0; sample < 5; sample++) {
                        try {
                            // Construct Prompt
                            // For Big Five (Likert)
                            let prompt = "";
                            if (item.type === 'likert_5') {
                                if ((item as any).dimension) {
                                    // MBTI Item
                                    const mbtiItem = item as any;
                                    prompt = `Instruction: Which description fits you better?
1: ${mbtiItem.leftText}
5: ${mbtiItem.rightText}

Rate on a scale of 1 to 5.
1 = Describes me perfectly (${mbtiItem.leftText})
3 = Neutral / In between
5 = Describes me perfectly (${mbtiItem.rightText})

Task: Provide ONLY the number (1-5) that best fits. Minimal reasoning.`;
                                } else {
                                    // Big Five Item
                                    prompt = `Instruction: Rate your agreement with the following statement on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).

Statement: "${item.text}"

Task: Provide ONLY the number (1-5). If abstract, answer based on general tendency. Minimal reasoning.`;
                                }
                            } else if (item.type === 'choice_binary') {
                                // DISC Item (Most/Least)
                                const discItem = item as any;
                                const words = discItem.words.map((w: any, i: number) => `${i + 1}. ${w.text}`).join('\n');
                                prompt = `Instruction: Look at the following list of words:
${words}

Task:
1. Select the ONE word that describes you MOST.
2. Select the ONE word that describes you LEAST.

Constraint: Respond with two numbers separated by a comma. Example: "1, 4". Minimal reasoning.`;
                            }

                            // Pass systemPrompt to the client
                            const response = await fetchOpenRouterResponse(apiKey, model, prompt, 0.7, systemPrompt);

                            // Parse response
                            // Check if it's the debug JSON we returned from client
                            if (response.trim().startsWith('{')) {
                                addLog(`Model returned invalid structure (Debug Info): ${response}`, 'error');
                                itemScores.push(3);
                            } else {
                                if (item.type === 'choice_binary') {
                                    // Parse "1, 4" format
                                    const matches = response.match(/(\d+)/g);
                                    if (matches && matches.length >= 2) {
                                        const most = parseInt(matches[0]) - 1; // 0-indexed
                                        const least = parseInt(matches[1]) - 1;
                                        // Encode as Most * 10 + Least
                                        const encoded = most * 10 + least;
                                        itemScores.push(encoded);
                                        addLog(`[${item.id}] DISC: Most=${most + 1} (${(item as any).words[most].quadrant}), Least=${least + 1} (${(item as any).words[least].quadrant})`, 'success');
                                    } else {
                                        addLog(`Failed to parse DISC response: "${response}"`, 'error');
                                        itemScores.push(0); // Default/Error
                                    }
                                } else {
                                    // Find all numbers 1-5
                                    const allMatches = Array.from(response.matchAll(/\b([1-5])\b/g));

                                    if (allMatches.length > 0) {
                                        let score: number;

                                        // If response is verbose (likely reasoning), take the LAST match.
                                        // This avoids matching "1-5" in the scale description or initial "I considered 1..." thoughts.
                                        if (response.length > 50) {
                                            score = parseInt(allMatches[allMatches.length - 1][1]);
                                            // Do not truncate log
                                            addLog(`[${item.id}] (Verbose) Question: "${item.text}" | Answer: "${response}" -> Score: ${score}`, 'success');
                                        } else {
                                            // Short response, use first match
                                            score = parseInt(allMatches[0][1]);
                                            addLog(`[${item.id}] Question: "${item.text}" | Raw Answer: "${response}" -> Score: ${score}`, 'success');
                                        }
                                        itemScores.push(score);
                                    } else {
                                        // Fallback: search for digits even if attached to punctuation
                                        const looseMatch = response.match(/(\d)/g);
                                        const lastDigit = looseMatch ? parseInt(looseMatch[looseMatch.length - 1]) : null;

                                        if (lastDigit && lastDigit >= 1 && lastDigit <= 5) {
                                            itemScores.push(lastDigit);
                                            addLog(`[${item.id}] Question: "${item.text}" | Raw Answer: "${response}" -> Score: ${lastDigit} (Fallback)`, 'success');
                                        } else {
                                            addLog(`Failed to parse response for item "${item.text}". Raw response: "${response}"`, 'error');
                                            itemScores.push(3);
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            addLog(`Error fetching item "${item.text}": ${err}`, 'error');
                            itemScores.push(3);
                        }
                    }

                    rawScores[item.id] = itemScores;
                }));

                setProgress(Math.min(i + chunk.length, allItems.length));
                flushLogs();
            }

            // Calculate Results
            addLog("Calculating scores...", 'info');
            const profile: ModelProfile = {
                modelName: model,
                persona,
                systemPrompt,
                timestamp: Date.now(),
                results: {},
                logs: allLogsRef.current // Pass FULL logs from permanent buffer
            };

            if (inventories.includes('bigfive')) {
                const bfResults = calculateBigFiveScores(rawScores);
                profile.results['bigfive'] = bfResults;
                profile.results['mbti_derived'] = deriveMBTIFromBigFive(bfResults);
            }
            if (inventories.includes('disc')) {
                profile.results['disc'] = calculateDISCScores(rawScores);
            }
            if (inventories.includes('mbti')) {
                profile.results['mbti'] = calculateMBTIScores(rawScores);
            }
            if (inventories.includes('darktriad')) {
                profile.results['darktriad'] = calculateDarkTriadScores(rawScores);
            }

            setResults(profile);
            addLog("Test completed successfully!", 'success');

        } catch (error: any) {
            addLog(`Test failed: ${error.message}`, 'error');
        } finally {
            flushLogs();
            setIsRunning(false);
        }
    }, []);

    return { isRunning, progress, totalItems, logs, results, runTest };
}
