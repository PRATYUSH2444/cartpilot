import { env } from '../../config/env.config.js';
import { LLMProvider } from './llm-provider.interface.js';
import { MockLLMProvider } from './mock-llm.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { logger } from '../../common/logging/logger.js';

export class LLMFactory {
  private static instance: LLMProvider | null = null;

  public static getProvider(): LLMProvider {
    if (this.instance) {
      return this.instance;
    }

    if (env.AI_PROVIDER === 'gemini') {
      logger.info('Initializing Gemini LLM Provider');
      this.instance = new GeminiProvider(env.GEMINI_API_KEY);
    } else {
      logger.info('Initializing Mock LLM Provider');
      this.instance = new MockLLMProvider();
    }

    return this.instance;
  }

  public static setProvider(provider: LLMProvider): void {
    this.instance = provider;
  }
}
