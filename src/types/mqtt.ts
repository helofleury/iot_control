export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export type LampState = 'ON' | 'OFF';
export type LampAction = LampState;

export type MessageDirection = 'sent' | 'received';

export type ThemeMode = 'light' | 'dark';

/** Mensagem exibida no histórico. */
export interface HistoryMessage {
  id: string;
  topic: string;
  payload: string;
  direction: MessageDirection;
  timestamp: number;
  /** false quando a mensagem recebida não passou na validação. */
  valid: boolean;
}

export interface SensorReading {
  value: number;
  updatedAt: number;
}

export interface LampReading {
  state: LampState;
  updatedAt: number;
}

export interface PublishResult {
  ok: boolean;
  /** Mensagem amigável quando ok === false. */
  reason?: string;
}

export type StatusListener = (status: ConnectionStatus, error?: string) => void;
export type MessageListener = (topic: string, payload: string) => void;

export interface BrokerEndpoint {
  host: string;
  port: number;
  path: string;
  useSSL: boolean;
}
