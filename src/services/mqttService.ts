import { Client, Message, MQTTError } from 'paho-mqtt';
import { MAX_RECONNECT_DELAY_MS, SUBSCRIBE_TOPICS } from '../config';
import {
  BrokerEndpoint,
  ConnectionStatus,
  MessageListener,
  StatusListener,
} from '../types/mqtt';

/**
 * Converte "wss://host:8884/mqtt" em host/porta/path/SSL.
 * Retorna null se a URL não for ws:// ou wss://.
 */
export function parseBrokerUrl(url: string): BrokerEndpoint | null {
  const match = /^(wss?):\/\/([^/:\s]+)(?::(\d+))?(\/\S*)?$/i.exec(url.trim());
  if (!match) return null;
  const useSSL = match[1].toLowerCase() === 'wss';
  const port = match[3] ? Number(match[3]) : useSSL ? 443 : 80;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return { host: match[2], port, path: match[4] ?? '/', useSSL };
}

function createClientId(): string {
  return `iotcontrol_${Math.random().toString(16).slice(2, 10)}`;
}

/**
 * Serviço MQTT desacoplado da interface.
 * A UI apenas registra listeners (subscribeStatus / subscribeMessages),
 * cada um devolvendo uma função de limpeza.
 */
class MqttService {
  private client: Client | null = null;
  private status: ConnectionStatus = 'disconnected';
  private lastError: string | undefined;
  private url = '';
  private manualDisconnect = false;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  /** Identifica a conexão atual; callbacks de conexões antigas são ignorados. */
  private connectionToken = 0;

  private statusListeners = new Set<StatusListener>();
  private messageListeners = new Set<MessageListener>();

  // ---------------------------------------------------------------- listeners

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status, this.lastError); // entrega o estado atual
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  subscribeMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected' && !!this.client?.isConnected();
  }

  // ------------------------------------------------------------------ conexão

  /** Conecta (ou reconecta imediatamente) ao broker informado. */
  connect(url: string): void {
    this.clearReconnectTimer();
    this.manualDisconnect = false;
    this.reconnectAttempts = 0;
    this.url = url;
    this.openConnection();
  }

  /** Desconecta e desativa a reconexão automática. */
  disconnect(): void {
    this.manualDisconnect = true;
    this.clearReconnectTimer();
    this.teardownClient();
    this.setStatus('disconnected');
  }

  private openConnection(): void {
    this.teardownClient();

    const endpoint = parseBrokerUrl(this.url);
    if (!endpoint) {
      this.manualDisconnect = true;
      this.setStatus(
        'error',
        'URL inválida. Use o formato ws://host:porta/caminho ou wss://host:porta/caminho.',
      );
      return;
    }

    const token = ++this.connectionToken;
    this.setStatus('connecting');

    let client: Client;
    try {
      client = new Client(
        endpoint.host,
        endpoint.port,
        endpoint.path,
        createClientId(),
      );
    } catch (error) {
      this.handleFailure(token, this.describeError(error));
      return;
    }
    this.client = client;

    client.onConnectionLost = (response: MQTTError) => {
      if (token !== this.connectionToken || this.manualDisconnect) return;
      const reason =
        response.errorCode === 0
          ? 'Conexão encerrada pelo broker.'
          : `Conexão perdida (${response.errorMessage}).`;
      this.handleFailure(token, reason);
    };

    client.onMessageArrived = (message: Message) => {
      if (token !== this.connectionToken) return;
      let payload: string;
      try {
        payload = message.payloadString;
      } catch {
        payload = '<payload não é texto UTF-8 válido>';
      }
      this.messageListeners.forEach((listener) =>
        listener(message.destinationName, payload),
      );
    };

    try {
      client.connect({
        timeout: 8,
        keepAliveInterval: 30,
        cleanSession: true,
        useSSL: endpoint.useSSL,
        reconnect: false, // a reconexão é controlada por este serviço
        onSuccess: () => {
          if (token !== this.connectionToken) return;
          this.reconnectAttempts = 0;
          this.subscribeAll(client);
          this.setStatus('connected');
        },
        onFailure: (error: MQTTError) => {
          if (token !== this.connectionToken) return;
          this.handleFailure(
            token,
            `Não foi possível conectar. ${this.friendlyReason(error)}`,
          );
        },
      });
    } catch (error) {
      this.handleFailure(token, this.describeError(error));
    }
  }

  private subscribeAll(client: Client): void {
    SUBSCRIBE_TOPICS.forEach((topic) => client.subscribe(topic, { qos: 0 }));
  }

  private handleFailure(token: number, reason: string): void {
    if (token !== this.connectionToken) return;
    this.teardownClient();
    if (this.manualDisconnect) {
      this.setStatus('disconnected');
      return;
    }
    this.scheduleReconnect(reason);
  }

  private scheduleReconnect(reason: string): void {
    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      MAX_RECONNECT_DELAY_MS,
    );
    this.reconnectAttempts += 1;
    this.setStatus(
      'error',
      `${reason} Nova tentativa em ${Math.round(delay / 1000)}s.`,
    );
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.manualDisconnect) this.openConnection();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /** Invalida callbacks antigos e fecha o cliente atual, se existir. */
  private teardownClient(): void {
    this.connectionToken += 1;
    const client = this.client;
    this.client = null;
    if (!client) return;
    // o Paho rejeita null; troca por funções vazias para ignorar eventos tardios
    client.onConnectionLost = () => undefined;
    client.onMessageArrived = () => undefined;
    try {
      if (client.isConnected()) client.disconnect();
    } catch {
      // cliente já estava fechado; nada a fazer
    }
  }

  // --------------------------------------------------------------- publicação

  /**
   * Publica uma mensagem. Lança erro se não estiver conectado
   * (nunca falha silenciosamente).
   */
  publish(topic: string, payload: string): void {
    if (!this.client || !this.isConnected()) {
      throw new Error('Sem conexão com o broker MQTT.');
    }
    const message = new Message(payload);
    message.destinationName = topic;
    message.qos = 0;
    message.retained = false;
    this.client.send(message);
  }

  // ------------------------------------------------------------------ helpers

  private setStatus(status: ConnectionStatus, error?: string): void {
    this.status = status;
    this.lastError = error;
    this.statusListeners.forEach((listener) => listener(status, error));
  }

  private friendlyReason(error: MQTTError): string {
    if (/socket/i.test(error.errorMessage)) {
      return 'Verifique a internet, a URL e se a porta é WebSocket (ex.: 8884 em wss://), não TCP 1883.';
    }
    return error.errorMessage;
  }

  private describeError(error: unknown): string {
    return error instanceof Error ? error.message : 'Erro desconhecido.';
  }
}

export const mqttService = new MqttService();
