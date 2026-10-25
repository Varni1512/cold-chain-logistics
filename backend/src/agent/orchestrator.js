import { OpenAI } from 'openai';
import { config } from '../config/env.js';
import { getSystemPrompt } from './prompts.js';
import { toolDefinitions, executeToolCall } from './tools.js';
import { writeAuditLog } from '../services/auditLog.js';

/**
 * Creates the LLM client according to config.agentLlm.
 * Groq is fast, free, and provides accurate tool-calling.
 */
function getLlmClient() {
  const mode = config.agentLlm;

  if (mode === 'OPENAI' && config.openaiApiKey) {
    return {
      client: new OpenAI({ apiKey: config.openaiApiKey }),
      model: 'gpt-4o'
    };
  }

  if (mode === 'DEEPSEEK' && config.deepseekApiKey) {
    return {
      client: new OpenAI({
        apiKey: config.deepseekApiKey,
        baseURL: 'https://api.deepseek.com'
      }),
      model: 'deepseek-chat'
    };
  }

  // Default: Groq (via OpenAI-compatible endpoint)
  const apiKey = config.groqApiKey;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in .env. Please provide a valid Groq or OpenAI key.');
  }

  return {
    client: new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    }),
    model: config.groqModel || 'openai/gpt-oss-120b'
  };
}

/**
 * Runs the agentic reasoning and tool execution loop.
 *
 * @param {string} sessionId - User session identifier
 * @param {Array<{role: string, content: string}>} history - Previous messages
 * @param {string} userInput - Current dispatcher query
 * @param {(event: {type: string, data: any}) => void} [onProgress] - Optional streaming callback
 * @returns {Promise<{content: string, traces: Array}>}
 */
export async function runAgentOrchestrator(sessionId, history = [], userInput, onProgress = null) {
  const { client, model } = getLlmClient();
  const systemPrompt = getSystemPrompt();

  const conversation = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8), // Keep last 8 turns for context window hygiene
    { role: 'user', content: userInput }
  ];

  const traces = [];
  let maxTurns = 10;
  let finalResponse = '';

  const emit = (type, data) => {
    traces.push({ type, ...data });
    if (onProgress) onProgress({ type, ...data });
  };

  emit('status', { message: 'Initializing Core Reasoner Node...', node: 'reasoner' });

  while (maxTurns > 0) {
    maxTurns--;

    const completion = await client.chat.completions.create({
      model: model,
      messages: conversation,
      tools: toolDefinitions,
      tool_choice: 'auto',
      temperature: 0.1
    });

    const choice = completion.choices[0];
    const message = choice.message;

    // Check if the LLM opted to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      conversation.push(message);

      for (const call of message.tool_calls) {
        const toolName = call.function.name;
        let toolArgs = {};
        try {
          toolArgs = JSON.parse(call.function.arguments || '{}');
        } catch {
          toolArgs = { raw: call.function.arguments };
        }

        emit('tool_input', {
          name: toolName,
          args: toolArgs,
          tool_call_id: call.id
        });

        // Record intent in DB audit log
        await writeAuditLog(sessionId, 'reasoner', toolName, toolArgs);

        emit('status', { message: `Executing Enterprise Subsystem: ${toolName}...`, node: 'tools' });

        // Execute the tool
        const output = await executeToolCall(toolName, toolArgs);

        emit('tool_output', {
          name: toolName,
          content: output,
          tool_call_id: call.id
        });

        // Record result in DB audit log
        await writeAuditLog(sessionId, 'tools', toolName, output);

        // Feed tool output back to agent
        conversation.push({
          role: 'tool',
          tool_call_id: call.id,
          content: String(output)
        });
      }
    } else {
      // Final synthesis received
      finalResponse = message.content || '';
      conversation.push({ role: 'assistant', content: finalResponse });

      await writeAuditLog(sessionId, 'reasoner_final', 'LLM Text Synthesis', finalResponse);
      emit('status', { message: 'Incident Matrix Evaluation Complete', node: 'complete' });
      break;
    }
  }

  if (!finalResponse) {
    finalResponse = '⚠️ Execution Notice: The reasoning engine completed tool assessments without producing a text summary.';
  }

  return {
    content: finalResponse,
    traces
  };
}
