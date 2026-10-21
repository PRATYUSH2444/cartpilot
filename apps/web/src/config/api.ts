/**
 * Centralized API Client Configuration
 * Supports dynamic runtime / build-time override via VITE_API_URL.
 * Falls back to local development gateway endpoint (http://localhost:5000/api/v1).
 */
export const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
