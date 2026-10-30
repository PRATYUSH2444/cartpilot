import mongoose from 'mongoose';
import { env } from '../../config/env.config.js';
import { LLMFactory } from '../../integrations/llm/llm-factory.js';

export interface IntegrationStatus {
  service: string;
  category: 'DATABASE' | 'AI' | 'PAYMENTS' | 'EMAIL' | 'SMS' | 'MAPS';
  status: 'CONNECTED' | 'CONFIGURED' | 'UNCONFIGURED' | 'ERROR';
  provider: string;
  details: string;
  isLive: boolean;
  maskedKey?: string;
}

export class SystemService {
  public static maskKey(key?: string): string | undefined {
    if (!key || key.length < 8) return undefined;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  }

  public static async getIntegrationsStatus(): Promise<IntegrationStatus[]> {
    const dbState = mongoose.connection.readyState;
    const isDbConnected = dbState === 1;

    // 1. Database
    const dbStatus: IntegrationStatus = {
      service: 'Primary Database',
      category: 'DATABASE',
      status: isDbConnected ? 'CONNECTED' : 'ERROR',
      provider: 'MongoDB',
      details: isDbConnected
        ? `Connected to ${mongoose.connection.host || 'cluster'}:${mongoose.connection.port || 27017}/${mongoose.connection.name}`
        : 'Disconnected from database cluster',
      isLive: isDbConnected,
    };

    // 2. AI / LLM
    const geminiKey = env.GEMINI_API_KEY;
    const openaiKey = env.OPENAI_API_KEY;
    const hasGemini = Boolean(geminiKey && geminiKey.trim() && geminiKey !== 'your_gemini_api_key_here');
    const hasOpenAI = Boolean(openaiKey && openaiKey.trim() && openaiKey !== 'your_openai_api_key_here');

    let aiStatus: IntegrationStatus;
    if (env.AI_PROVIDER === 'gemini' && hasGemini) {
      aiStatus = {
        service: 'Generative AI Engine',
        category: 'AI',
        status: 'CONNECTED',
        provider: `Google Gemini (${env.GEMINI_MODEL})`,
        details: 'Live inference active with native function calling',
        isLive: true,
        maskedKey: this.maskKey(geminiKey),
      };
    } else if (env.AI_PROVIDER === 'openai' && hasOpenAI) {
      aiStatus = {
        service: 'Generative AI Engine',
        category: 'AI',
        status: 'CONNECTED',
        provider: `OpenAI (${env.OPENAI_MODEL})`,
        details: 'Live inference active with native function calling',
        isLive: true,
        maskedKey: this.maskKey(openaiKey),
      };
    } else {
      aiStatus = {
        service: 'Generative AI Engine',
        category: 'AI',
        status: 'UNCONFIGURED',
        provider: env.AI_PROVIDER === 'openai' ? 'OpenAI' : 'Google Gemini',
        details: 'API key is missing or unconfigured. Paste key to enable live inference.',
        isLive: false,
      };
    }

    // 3. Payments
    const isLiveRazorpay =
      Boolean(env.RAZORPAY_KEY_ID) &&
      !env.RAZORPAY_KEY_ID.includes('placeholder') &&
      env.RAZORPAY_KEY_ID.startsWith('rzp_');

    const paymentStatus: IntegrationStatus = {
      service: 'Payment Gateway',
      category: 'PAYMENTS',
      status: isLiveRazorpay ? 'CONFIGURED' : 'UNCONFIGURED',
      provider: 'Razorpay',
      details: isLiveRazorpay
        ? 'Razorpay gateway orders and cryptographic HMAC verification active'
        : 'Running in simulated test transaction mode (rzp_test keys placeholder)',
      isLive: isLiveRazorpay,
      maskedKey: this.maskKey(env.RAZORPAY_KEY_ID),
    };

    // 4. Email
    const hasResend =
      Boolean(env.RESEND_API_KEY) &&
      env.RESEND_API_KEY !== 'your_resend_api_key_here';

    const emailStatus: IntegrationStatus = {
      service: 'Transactional Email',
      category: 'EMAIL',
      status: hasResend ? 'CONFIGURED' : 'UNCONFIGURED',
      provider: 'Resend',
      details: hasResend
        ? `Live email delivery active via Resend (${env.RESEND_FROM_EMAIL})`
        : 'Console delivery fallback active. Configure RESEND_API_KEY for carrier dispatch.',
      isLive: hasResend,
      maskedKey: this.maskKey(env.RESEND_API_KEY),
    };

    // 5. SMS / OTP
    const hasTwilio = Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_PHONE_NUMBER);
    const smsStatus: IntegrationStatus = {
      service: 'SMS / OTP Carrier',
      category: 'SMS',
      status: hasTwilio ? 'CONFIGURED' : 'UNCONFIGURED',
      provider: 'Twilio',
      details: hasTwilio
        ? `Carrier SMS dispatch active via ${env.TWILIO_PHONE_NUMBER}`
        : 'Development OTP generation active. Configure Twilio SID & Token for carrier SMS.',
      isLive: hasTwilio,
    };

    // 6. Maps & Geocoding
    const hasGoogleMaps = Boolean(env.GOOGLE_MAPS_API_KEY && env.GOOGLE_MAPS_API_KEY !== 'your_google_maps_key_here');
    const mapsStatus: IntegrationStatus = {
      service: 'Maps & Geocoding',
      category: 'MAPS',
      status: 'CONNECTED',
      provider: hasGoogleMaps ? 'Google Maps Platform' : 'OpenStreetMap Nominatim',
      details: hasGoogleMaps
        ? 'Google Maps Geocoding & Distance Matrix active'
        : 'OpenStreetMap Nominatim active (No API key needed, real coordinates)',
      isLive: true,
      maskedKey: this.maskKey(env.GOOGLE_MAPS_API_KEY),
    };

    return [dbStatus, aiStatus, paymentStatus, emailStatus, smsStatus, mapsStatus];
  }

  public static async testLLMConnection(
    provider: 'gemini' | 'openai',
    apiKey: string
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    return LLMFactory.testProvider(provider, apiKey);
  }

  public static setRuntimeKey(provider: 'gemini' | 'openai', apiKey: string): void {
    LLMFactory.setRuntimeKey(provider, apiKey);
  }
}
