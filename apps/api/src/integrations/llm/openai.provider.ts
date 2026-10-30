import {
  LLMProvider,
  AgentMessage,
  AgentToolDeclaration,
  LLMResponse,
  AgentToolCall,
} from './llm-provider.interface.js';
import { logger } from '../../common/logging/logger.js';
import { env } from '../../config/env.config.js';
import { AppError } from '../../common/errors/app-error.js';

export class OpenAIProvider implements LLMProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || env.OPENAI_API_KEY || '';
    this.model = model || env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  public async generateResponse(
    messages: AgentMessage[],
    tools: AgentToolDeclaration[],
    systemPrompt: string
  ): Promise<LLMResponse> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      const errorMsg =
        'Live OpenAI inference is currently unconfigured. Please provide a valid OPENAI_API_KEY in apps/api/.env or configure it via the Integrations panel.';
      logger.warn(errorMsg);
      return {
        text: `⚠️ **AI Provider Notice**: ${errorMsg}`,
        isSimulated: false,
        provider: 'openai',
      };
    }

    try {
      // 1. Convert tools to OpenAI format
      const openaiTools = tools.map((t) => ({
        type: 'function' as const,
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      // 2. Convert messages to OpenAI chat format
      const openaiMessages: any[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      for (const m of messages) {
        if (m.role === 'tool') {
          openaiMessages.push({
            role: 'tool',
            tool_call_id: m.toolCalls?.[0]?.id || `call_${Date.now()}`,
            content: JSON.stringify(m.toolResult || {}),
          });
        } else if (m.role === 'assistant') {
          const assistantMsg: any = {
            role: 'assistant',
            content: m.content || null,
          };
          if (m.toolCalls && m.toolCalls.length > 0) {
            assistantMsg.tool_calls = m.toolCalls.map((tc) => ({
              id: tc.id || `call_${Date.now()}`,
              type: 'function',
              function: {
                name: tc.name,
                arguments: JSON.stringify(tc.arguments || {}),
              },
            }));
          }
          openaiMessages.push(assistantMsg);
        } else {
          openaiMessages.push({
            role: 'user',
            content: m.content,
          });
        }
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: openaiMessages,
          tools: openaiTools.length > 0 ? openaiTools : undefined,
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error({ status: response.status, errorText }, 'OpenAI API call failed');
        throw new AppError(
          'OPENAI_API_ERROR',
          `OpenAI API request failed (${response.status}): ${errorText}`,
          response.status >= 500 ? 503 : 400
        );
      }

      const data = (await response.json()) as any;
      const choice = data.choices?.[0];
      const message = choice?.message;

      const toolCalls: AgentToolCall[] = [];
      if (message?.tool_calls && Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }
          toolCalls.push({
            id: tc.id,
            name: tc.function.name,
            arguments: parsedArgs,
          });
        }
      }

      return {
        text: message?.content || '',
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        isSimulated: false,
        provider: 'openai',
      };
    } catch (err: any) {
      logger.error({ err }, 'Error during OpenAI API invocation');
      if (err instanceof AppError) throw err;
      throw new AppError(
        'AI_SERVICE_UNAVAILABLE',
        `OpenAI conversational service error: ${err.message || 'Unknown network error'}`,
        503
      );
    }
  }
}
