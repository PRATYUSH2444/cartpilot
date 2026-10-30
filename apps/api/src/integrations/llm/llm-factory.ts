import { env } from '../../config/env.config.js';
import { LLMProvider } from './llm-provider.interface.js';
import { MockLLMProvider } from './mock-llm.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { logger } from '../../common/logging/logger.js';

export class LLMFactory {
  private static instance: LLMProvider | null = null;
  private static runtimeGeminiKey: string | null = null;
  private static runtimeOpenAIKey: string | null = null;

  public static getProvider(): LLMProvider {
    if (this.instance) {
      return this.instance;
    }

    const providerType = env.AI_PROVIDER;

    if (providerType === 'openai' || (!env.GEMINI_API_KEY && env.OPENAI_API_KEY)) {
      logger.info('Initializing Real OpenAI LLM Provider');
      this.instance = new OpenAIProvider(
        this.runtimeOpenAIKey || env.OPENAI_API_KEY,
        env.OPENAI_MODEL
      );
    } else if (providerType === 'gemini') {
      logger.info('Initializing Real Gemini LLM Provider');
      this.instance = new GeminiProvider(
        this.runtimeGeminiKey || env.GEMINI_API_KEY,
        env.GEMINI_MODEL
      );
    } else {
      logger.warn('Initializing Mock LLM Provider');
      this.instance = new MockLLMProvider();
    }

    return this.instance;
  }

  public static setRuntimeKey(provider: 'gemini' | 'openai', apiKey: string): void {
    if (provider === 'gemini') {
      this.runtimeGeminiKey = apiKey;
      this.instance = new GeminiProvider(apiKey, env.GEMINI_MODEL);
    } else if (provider === 'openai') {
      this.runtimeOpenAIKey = apiKey;
      this.instance = new OpenAIProvider(apiKey, env.OPENAI_MODEL);
    }
  }

  public static setProvider(provider: LLMProvider): void {
    this.instance = provider;
  }

  public static resetProvider(): void {
    this.instance = null;
  }

  public static async testProvider(
    provider: 'gemini' | 'openai',
    apiKey: string
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    const startTime = Date.now();
    try {
      const testInstance =
        provider === 'gemini'
          ? new GeminiProvider(apiKey, env.GEMINI_MODEL)
          : new OpenAIProvider(apiKey, env.OPENAI_MODEL);

      const res = await testInstance.generateResponse(
        [{ role: 'user', content: 'Say "CartPilot AI is online"' }],
        [],
        'You are a testing assistant. Reply concisely.'
      );

      const latencyMs = Date.now() - startTime;
      if (res.text && !res.text.includes('⚠️')) {
        return {
          success: true,
          message: res.text.trim(),
          latencyMs,
        };
      } else {
        return {
          success: false,
          message: res.text || 'Empty response from model',
          latencyMs,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Connection failed',
        latencyMs: Date.now() - startTime,
      };
    }
  }
}
