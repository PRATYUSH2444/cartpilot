import { UserRole } from '../context/AuthContext';

export interface DemoCredential {
  email: string;
  password: string;
}

export const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> | null = import.meta.env.DEV
  ? {
      CUSTOMER: { email: 'customer@example.com', password: 'Customer1234!' },
      MERCHANT: { email: 'merchant@example.com', password: 'Merchant1234!' },
      ADMIN: { email: 'admin@example.com', password: 'Admin1234!' },
    }
  : null;
