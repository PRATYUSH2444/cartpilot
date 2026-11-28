import { UserRole } from '../context/AuthContext';

export interface DemoCredential {
  email: string;
  password: string;
}

export const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> = {
  CUSTOMER: { email: 'customer@example.com', password: 'Customer1234!' },
  MERCHANT: { email: 'merchant@freshgrocers.com', password: 'Merchant1234!' },
  ADMIN: { email: 'admin@cartpilot.com', password: 'Admin1234!' },
};
