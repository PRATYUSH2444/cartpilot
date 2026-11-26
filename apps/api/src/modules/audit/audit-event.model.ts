import mongoose, { Document, Schema } from 'mongoose';

export type AuditActorRole = 'CUSTOMER' | 'MERCHANT' | 'ADMIN' | 'SYSTEM';

export type AuditResourceType =
  | 'CART'
  | 'MANDATE'
  | 'POLICY'
  | 'APPROVAL'
  | 'PAYMENT'
  | 'ORDER'
  | 'INVENTORY'
  | 'USER'
  | 'MERCHANT'
  | 'SESSION'
  | 'STAFF'
  | 'PRODUCT';

export type AuditEventType =
  | 'USER_REGISTERED'
  | 'USER_LOGGED_IN'
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_PASSWORD_RESET_REQUESTED'
  | 'AUTH_PASSWORD_RESET_COMPLETED'
  | 'AUTH_PASSWORD_CHANGED'
  | 'AUTH_SESSION_REVOKED'
  | 'AUTH_ALL_SESSIONS_REVOKED'
  | 'AUTH_TOKEN_REUSE_DETECTED'
  | 'AUTH_EMAIL_VERIFIED'
  | 'MERCHANT_APPLICATION_SUBMITTED'
  | 'MERCHANT_STATUS_UPDATED'
  | 'MERCHANT_PRODUCT_CREATED'
  | 'MERCHANT_PRODUCT_UPDATED'
  | 'MERCHANT_PRODUCT_ARCHIVED'
  | 'INVENTORY_STOCK_ADJUSTED'
  | 'STAFF_INVITED'
  | 'STAFF_INVITATION_ACCEPTED'
  | 'STAFF_REVOKED'
  | 'ADMIN_PROVISIONED'
  | 'MANDATE_UPDATED'
  | 'POLICY_EVALUATION'
  | 'APPROVAL_REQUESTED'
  | 'APPROVAL_DECIDED'
  | 'APPROVAL_INVALIDATED'
  | 'CART_UPDATED'
  | 'CART_CLEARED'
  | 'STOCK_RESERVED'
  | 'RESERVATION_EXPIRED'
  | 'RESERVATION_CONSUMED'
  | 'RESERVATION_RELEASED'
  | 'PAYMENT_INITIATED'
  | 'PAYMENT_VERIFIED'
  | 'PAYMENT_FAILED'
  | 'ORDER_CONFIRMED'
  | 'DELIVERY_STATUS_UPDATED';

export interface IAuditEvent {
  sequenceNumber: number;
  timestamp: Date;
  eventType: AuditEventType;
  actorId: string;
  actorRole: AuditActorRole;
  resourceId: string;
  resourceType: AuditResourceType;
  payload: Record<string, unknown>;
  payloadHash: string;
  previousHash: string;
  currentHash: string;
  createdAt: Date;
}

export interface AuditEventDocument extends IAuditEvent, Document {}

const auditEventSchema = new Schema<AuditEventDocument>(
  {
    sequenceNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    actorId: {
      type: String,
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['CUSTOMER', 'MERCHANT', 'ADMIN', 'SYSTEM'],
      required: true,
    },
    resourceId: {
      type: String,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: [
        'CART',
        'MANDATE',
        'POLICY',
        'APPROVAL',
        'PAYMENT',
        'ORDER',
        'INVENTORY',
        'USER',
        'MERCHANT',
        'SESSION',
        'STAFF',
        'PRODUCT',
      ],
      required: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    payloadHash: {
      type: String,
      required: true,
    },
    previousHash: {
      type: String,
      required: true,
    },
    currentHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Append-only ledger
  }
);

export const AuditEventModel = mongoose.model<AuditEventDocument>('AuditEvent', auditEventSchema);
