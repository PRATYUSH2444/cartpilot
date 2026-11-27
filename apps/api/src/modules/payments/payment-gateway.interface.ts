export interface GatewayOrder {
  id: string;
  amountPaise: number;
  currency: string;
  receipt?: string;
  status: string;
}

export interface GatewayRefund {
  id: string;
  paymentId: string;
  amountPaise: number;
  status: string;
}

export interface IPaymentGateway {
  isConfigured(): boolean;
  createOrder(
    amountPaise: number,
    receipt: string,
    notes?: Record<string, string>
  ): Promise<GatewayOrder>;
  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  initiateRefund(
    paymentId: string,
    amountPaise: number,
    notes?: Record<string, string>
  ): Promise<GatewayRefund>;
}
