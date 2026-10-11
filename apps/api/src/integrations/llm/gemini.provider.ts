import {
  LLMProvider,
  AgentMessage,
  AgentToolDeclaration,
  LLMResponse,
  AgentToolCall,
} from './llm-provider.interface.js';
import { MockLLMProvider } from './mock-llm.provider.js';
import { logger } from '../../common/logging/logger.js';

export class GeminiProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly fallbackProvider: MockLLMProvider;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
    this.fallbackProvider = new MockLLMProvider();
  }

  public async generateResponse(
    messages: AgentMessage[],
    tools: AgentToolDeclaration[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      logger.info('No GEMINI_API_KEY configured; utilizing resilient mock LLM engine');
      return this.fallbackProvider.generateResponse(messages, tools, systemPrompt);
    }

    try {
      // Convert tools to Gemini function declarations
      const functionDeclarations = tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      }));

      // Convert conversation history to Gemini contents format
      const contents = messages
        .filter((m) => m.role !== 'system')
        .map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'function',
              parts: [
                {
                  functionResponse: {
                    name: m.toolCalls?.[0]?.name || 'tool_response',
                    response: m.toolResult || {},
                  },
                },
              ],
            };
          }

          if (m.role === 'assistant') {
            const parts: any[] = [];
            if (m.content) parts.push({ text: m.content });
            if (m.toolCalls && m.toolCalls.length > 0) {
              for (const tc of m.toolCalls) {
                parts.push({
                  functionCall: {
                    name: tc.name,
                    args: tc.arguments,
                  },
                });
              }
            }
            return { role: 'model', parts };
          }

          return {
            role: 'user',
            parts: [{ text: m.content }],
          };
        });

      const requestBody = {
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        tools: [{ functionDeclarations }],
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.warn(
          { status: response.status, errorText },
          'Gemini API call failed, falling back to mock provider'
        );
        return this.fallbackProvider.generateResponse(messages, tools, systemPrompt);
      }

      const data = (await response.json()) as any;
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let responseText = '';
      const toolCalls: AgentToolCall[] = [];

      for (const part of parts) {
        if (part.text) {
          responseText += part.text;
        }
        if (part.functionCall) {
          toolCalls.push({
            id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: part.functionCall.name,
            arguments: part.functionCall.args || {},
          });
        }
      }

      return {
        text: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } catch (err) {
      logger.error({ err }, 'Error communicating with Gemini API, falling back to mock provider');
      return this.fallbackProvider.generateResponse(messages, tools, systemPrompt);
    }
  }
}
