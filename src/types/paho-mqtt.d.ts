// Declarações mínimas (e tipadas) para o pacote "paho-mqtt" v1.1.x,
// que não possui tipos oficiais compatíveis com a API de módulo.
declare module 'paho-mqtt' {
  export interface MQTTError {
    errorCode: number;
    errorMessage: string;
  }

  export interface ConnectionOptions {
    timeout?: number;
    keepAliveInterval?: number;
    cleanSession?: boolean;
    useSSL?: boolean;
    reconnect?: boolean;
    onSuccess?: () => void;
    onFailure?: (error: MQTTError) => void;
  }

  export interface SubscribeOptions {
    qos?: 0 | 1 | 2;
    onSuccess?: () => void;
    onFailure?: (error: MQTTError) => void;
  }

  export class Message {
    constructor(payload: string);
    destinationName: string;
    qos: 0 | 1 | 2;
    retained: boolean;
    readonly payloadString: string;
  }

  export class Client {
    constructor(host: string, port: number, path: string, clientId: string);
    onConnectionLost: (error: MQTTError) => void;
    onMessageArrived: (message: Message) => void;
    connect(options?: ConnectionOptions): void;
    disconnect(): void;
    isConnected(): boolean;
    subscribe(filter: string, options?: SubscribeOptions): void;
    unsubscribe(filter: string): void;
    send(message: Message): void;
  }
}
