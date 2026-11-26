import { Request, Response, NextFunction } from 'express';
import { SystemService } from './system.service.js';

export async function getIntegrations(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const integrations = await SystemService.getIntegrationsStatus();
    res.status(200).json({
      success: true,
      data: {
        integrations,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function testIntegration(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey) {
      res.status(400).json({
        success: false,
        error: 'Both provider and apiKey are required in the request body',
      });
      return;
    }

    if (provider !== 'gemini' && provider !== 'openai') {
      res.status(400).json({
        success: false,
        error: 'Provider must be either "gemini" or "openai"',
      });
      return;
    }

    const result = await SystemService.testLLMConnection(provider, apiKey);
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey) {
      res.status(400).json({
        success: false,
        error: 'Both provider and apiKey are required in the request body',
      });
      return;
    }

    if (provider !== 'gemini' && provider !== 'openai') {
      res.status(400).json({
        success: false,
        error: 'Provider must be either "gemini" or "openai"',
      });
      return;
    }

    SystemService.setRuntimeKey(provider, apiKey);

    res.status(200).json({
      success: true,
      data: {
        message: `Successfully updated runtime key for provider: ${provider}`,
        provider,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getHomeContent(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const homeContent = {
      hero: {
        headline: "Fresh Groceries, Delivered Every Morning",
        deliverySlot: "6 AM – 9 AM",
        orderCutoff: "Order till Midnight",
        subtitle: "100% Pure Vegetarian groceries handpicked fresh and delivered to your doorstep.",
        ctaText: "Shop Now",
      },
      offers: [
        {
          id: "offer-wallet-topup",
          title: "Add ₹999 & Get ₹100 Bonus",
          description: "Bonus will be credited directly to your CartPilot Wallet balance.",
          code: "WALLET100",
          topUpAmountPaise: 99900,
          bonusAmountPaise: 10000,
        },
      ],
      valueProps: [
        {
          id: "prop-morning",
          title: "Scheduled Delivery",
          subtitle: "6 AM – 9 AM fresh slots",
        },
        {
          id: "prop-veg",
          title: "100% Pure Veg",
          subtitle: "Strict vegetarian assurance",
        },
        {
          id: "prop-guardrails",
          title: "Spend Guardrails",
          subtitle: "Zero unapproved checkout",
        },
        {
          id: "prop-prices",
          title: "Best Daily Prices",
          subtitle: "Direct mandi partnerships",
        },
      ],
    };

    res.status(200).json({
      success: true,
      data: homeContent,
    });
  } catch (error) {
    next(error);
  }
}
