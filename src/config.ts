/**
 * Configuração central do projeto.
 *
 * IMPORTANTE: troque TOPIC_PREFIX pelo identificador do SEU grupo
 * (ex.: "fiap/turma/mindsync") e use o MESMO valor no simulador
 * (variável de ambiente TOPIC_PREFIX, veja o README).
 */
export const TOPIC_PREFIX = 'fiap/turma/mindsync'; // TODO: altere para o identificador do seu grupo

export const TOPICS = {
  temperature: `${TOPIC_PREFIX}/sensor/temperatura`, // Subscribe
  humidity: `${TOPIC_PREFIX}/sensor/umidade`, // Subscribe
  lampCommand: `${TOPIC_PREFIX}/lampada/comando`, // Publish
  lampState: `${TOPIC_PREFIX}/lampada/estado`, // Subscribe
} as const;

export const SUBSCRIBE_TOPICS: readonly string[] = [
  TOPICS.temperature,
  TOPICS.humidity,
  TOPICS.lampState,
];

/**
 * Broker público do HiveMQ via WebSocket seguro (WSS, porta 8884).
 * Alternativa sem TLS: ws://broker.hivemq.com:8000/mqtt
 * (não confundir com a porta TCP 1883, que NÃO funciona no app).
 */
export const DEFAULT_BROKER_URL = 'wss://broker.hivemq.com:8884/mqtt';

export const HISTORY_LIMIT = 10;
/** Tempo máximo esperando a confirmação de estado da lâmpada. */
export const COMMAND_TIMEOUT_MS = 6000;
export const MAX_RECONNECT_DELAY_MS = 15000;
