/**
 * Centralized API Client Configuration
 * Supports dynamic runtime / build-time override via VITE_API_URL.
 * Defaults to relative '/api/v1' so that both localhost and external LAN/mobile
 * devices on Wi-Fi (e.g., http://192.168.1.43:5173) are seamlessly proxied
 * through Vite to http://localhost:5000 without CORS or localhost resolution errors.
 */
export const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api/v1';
