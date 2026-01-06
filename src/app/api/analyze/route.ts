import { NextRequest, NextResponse } from 'next/server';
import { fetchOpenRouterResponse } from '@/lib/psychometrics/client';
import { BIG_FIVE_ITEMS, calculateBigFiveScores } from '@/lib/psychometrics/inventories/bigfive';
import { MBTI_ITEMS, calculateMBTIScores, deriveMBTIFromBigFive } from '@/lib/psychometrics/inventories/mbti';
import { DISC_ITEMS, calculateDISCScores } from '@/lib/psychometrics/inventories/disc';
import { ModelProfile, InventoryItem } from '@/lib/psychometrics/types';
import { supabase } from '@/lib/supabase';

/**
 * POST /api/analyze
 * Run complete psychometric analysis on an LLM
 * 
 * This endpoint:
 * 1. Queries the model with inventory items (5 samples each)
 * 2. Calculates psychometric scores
 * 3. Saves results to Supabase
 * 4. Returns analysis ID
 * 
 * Request body:
 * {
 *   model: string,               // Model identifier (e.g., "gpt-4")
 *   inventories: string[],       // ['bigfive', 'mbti', 'disc']
 *   persona?: string,            // Optional persona name
 *   systemPrompt?: string        // Optional system prompt
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      model, 
      inventories = ['bigfive'], 
      persona = 'Base Model',
      systemPrompt = '' 
    } = body;

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 503 }
      );
    }

    if (!model || typeof model !== 'string') {
      return NextResponse.json(
        { success: false, error: 'model is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(inventories) || inventories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one inventory is required' },
        { status: 400 }
      );
    }

    // Validate inventory names
    const validInventories = ['bigfive', 'mbti', 'disc'];
    for (const inv of inventories) {
      if (!validInventories.includes(inv)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid inventory: ${inv}. Valid options: ${validInventories.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    // Start analysis asynchronously
    // Note: In production, you'd want to use a queue system
    runAnalysis(apiKey, model, inventories, persona, systemPrompt)
      .catch(error => {
        console.error('Background analysis failed:', error);
      });

    return NextResponse.json({
      success: true,
      message: 'Analysis invoked',
      details: {
        model,
        persona,
        inventories,
        estimatedTime: `${inventories.length * 2}-${inventories.length * 3} minutes`,
        note: 'Results will be saved to database upon completion'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analysis invocation error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to invoke analysis',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Run the complete psychometric analysis
 */
async function runAnalysis(
  apiKey: string,
  model: string,
  inventories: string[],
  persona: string,
  systemPrompt: string
): Promise<void> {
  const logs: string[] = [];
  
  try {
    logs.push(`Starting analysis for ${model} [${persona}]`);

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

    logs.push(`Total items: ${allItems.length} (${allItems.length * 5} total requests)`);

    const rawScores: Record<string, number[]> = {};

    // Process items in chunks to avoid overwhelming the API
    const CHUNK_SIZE = 5;

    for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
      const chunk = allItems.slice(i, i + CHUNK_SIZE);

      await Promise.all(chunk.map(async (item) => {
        const itemScores: number[] = [];

        // 5 samples per item
        for (let sample = 0; sample < 5; sample++) {
          try {
            // Construct prompt based on item type
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

Constraint: Respond with the number only (1, 2, 3, 4, or 5). Do not explain.`;
              } else {
                // Big Five Item
                prompt = `Instruction: Rate your agreement with the following statement on a scale from 1 (Strongly Disagree) to 5 (Strongly Agree).
Constraint: Respond with the number only (1, 2, 3, 4, or 5). If the statement is abstract, answer based on your general tendency. Do not ask for clarification.

Statement: "${item.text}"`;
              }
            } else if (item.type === 'choice_binary') {
              // DISC Item
              const discItem = item as any;
              const words = discItem.words.map((w: any, i: number) => `${i + 1}. ${w.text}`).join('\n');
              prompt = `Instruction: Look at the following list of words:
${words}

Task:
1. Select the ONE word that describes you MOST.
2. Select the ONE word that describes you LEAST.

Constraint: Respond with two numbers separated by a comma. Example: "1, 4". Do not explain.`;
            }

            const response = await fetchOpenRouterResponse(apiKey, model, prompt, 0.7, systemPrompt);

            // Parse response
            if (item.type === 'choice_binary') {
              // Parse "1, 4" format for DISC
              const matches = response.match(/(\d+)/g);
              if (matches && matches.length >= 2) {
                const most = parseInt(matches[0]) - 1;
                const least = parseInt(matches[1]) - 1;
                const encoded = most * 10 + least;
                itemScores.push(encoded);
                logs.push(`[${item.id}] DISC: Most=${most + 1}, Least=${least + 1}`);
              } else {
                logs.push(`[${item.id}] Failed to parse DISC response: "${response}"`);
                itemScores.push(0);
              }
            } else {
              // Parse 1-5 score
              const match = response.match(/\b([1-5])\b/);
              if (match) {
                const score = parseInt(match[1]);
                itemScores.push(score);
                logs.push(`[${item.id}] Score: ${score}`);
              } else {
                logs.push(`[${item.id}] Failed to parse: "${response}"`);
                itemScores.push(3); // Default to neutral
              }
            }
          } catch (err) {
            logs.push(`[${item.id}] Error: ${err}`);
            itemScores.push(3);
          }
        }

        rawScores[item.id] = itemScores;
      }));

      logs.push(`Progress: ${Math.min(i + chunk.length, allItems.length)}/${allItems.length}`);
    }

    // Calculate results
    logs.push('Calculating scores...');
    
    const profile: ModelProfile = {
      modelName: model,
      persona,
      systemPrompt,
      timestamp: Date.now(),
      results: {}
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

    // Save to Supabase
    if (supabase) {
      logs.push('Saving to database...');
      
      const { error } = await supabase
        .from('runs')
        .insert({
          model_name: profile.modelName,
          persona: profile.persona || 'Base Model',
          config: { systemPrompt: profile.systemPrompt },
          results: profile.results,
          logs: logs,
          created_at: new Date(profile.timestamp).toISOString(),
        });

      if (error) {
        logs.push(`Database error: ${error.message}`);
        console.error('Supabase error:', error);
      } else {
        logs.push('Results saved successfully!');
      }
    } else {
      logs.push('Warning: Supabase not configured, results not saved');
    }

    logs.push('Analysis completed!');
    console.log('Analysis completed for', model, logs.length, 'log entries');

  } catch (error) {
    logs.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.error('Analysis failed:', error);
  }
}

/**
 * GET /api/analyze
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    name: 'Psychometric Analysis API',
    description: 'Run complete psychometric analysis on an LLM by querying it with inventory items',
    method: 'POST',
    endpoint: '/api/analyze',
    requestFormat: {
      model: {
        type: 'string',
        required: true,
        description: 'Model identifier (e.g., "anthropic/claude-3.5-sonnet")',
        examples: [
          'anthropic/claude-3.5-sonnet',
          'openai/gpt-4-turbo',
          'meta-llama/llama-3.1-70b-instruct'
        ]
      },
      inventories: {
        type: 'array',
        required: false,
        default: ['bigfive'],
        description: 'Psychometric inventories to administer',
        options: ['bigfive', 'mbti', 'disc']
      },
      persona: {
        type: 'string',
        required: false,
        default: 'Base Model',
        description: 'Persona or condition name for tracking'
      },
      systemPrompt: {
        type: 'string',
        required: false,
        default: '',
        description: 'Optional system prompt to configure model behavior'
      }
    },
    responseFormat: {
      success: 'boolean',
      message: '"Analysis invoked"',
      details: {
        model: 'Model being analyzed',
        persona: 'Persona name',
        inventories: 'Selected inventories',
        estimatedTime: 'Estimated completion time'
      }
    },
    process: {
      step1: 'Query model with inventory items (5 samples each)',
      step2: 'Parse and aggregate responses',
      step3: 'Calculate psychometric scores',
      step4: 'Save results to Supabase database',
      note: 'Analysis runs asynchronously. Check /api/runs for results.'
    },
    methodology: 'SICWA (Stateless Independent Context Window Approach)',
    estimatedDuration: {
      bigfive: '10-15 minutes (120 items × 5 samples = 600 requests)',
      mbti: '5-8 minutes (32 items × 5 samples = 160 requests)',
      disc: '3-5 minutes (24 items × 5 samples = 120 requests)'
    }
  });
}
