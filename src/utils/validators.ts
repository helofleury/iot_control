import { LampState } from '../types/mqtt';

function parseJson(payload: string): Record<string, unknown> | null {
  try {
    const data: unknown = JSON.parse(payload);
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return data as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function parseNumericValue(
  payload: string,
  min: number,
  max: number,
): number | null {
  const data = parseJson(payload);
  if (!data) return null;
  const value = data.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

/** Espera {"value": 24.5}. Retorna null se inválido. */
export const parseTemperature = (payload: string): number | null =>
  parseNumericValue(payload, -60, 150);

/** Espera {"value": 58}. Retorna null se inválido. */
export const parseHumidity = (payload: string): number | null =>
  parseNumericValue(payload, 0, 100);

/** Espera {"state": "ON" | "OFF"}. Retorna null se inválido. */
export function parseLampState(payload: string): LampState | null {
  const data = parseJson(payload);
  if (!data) return null;
  return data.state === 'ON' || data.state === 'OFF' ? data.state : null;
}
