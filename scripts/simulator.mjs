#!/usr/bin/env node
/**
 * Simulador do dispositivo IoT (roda no computador, sem hardware).
 *
 *  - Publica temperatura e umidade a cada 3 s
 *  - Escuta comandos da lâmpada ({"action":"ON"|"OFF"}) e responde
 *    publicando o novo estado ({"state":"ON"|"OFF"})
 *
 * Variáveis de ambiente (opcionais):
 *   TOPIC_PREFIX  prefixo dos tópicos (padrão: fiap/turma/mindsync)
 *   BROKER_URL    URL do broker (padrão: mqtt://broker.hivemq.com:1883)
 *                 também aceita wss://broker.hivemq.com:8884/mqtt
 *
 * Comandos digitados no terminal enquanto roda:
 *   bad    publica uma temperatura inválida (testa a validação do app)
 *   state  republica o estado atual da lâmpada
 *   quit   encerra
 */
import mqtt from 'mqtt';
import readline from 'node:readline';

const PREFIX = process.env.TOPIC_PREFIX ?? 'fiap/turma/mindsync';
const BROKER_URL = process.env.BROKER_URL ?? 'mqtt://broker.hivemq.com:1883';

const TOPICS = {
  temperature: `${PREFIX}/sensor/temperatura`,
  humidity: `${PREFIX}/sensor/umidade`,
  lampCommand: `${PREFIX}/lampada/comando`,
  lampState: `${PREFIX}/lampada/estado`,
};

const log = (...args) =>
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}]`, ...args);

let temperature = 24.5;
let humidity = 58;
let lampState = 'OFF';

const client = mqtt.connect(BROKER_URL, {
  clientId: `iotcontrol_sim_${Math.random().toString(16).slice(2, 10)}`,
  reconnectPeriod: 3000,
});

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function publishSensors() {
  temperature = clamp(temperature + (Math.random() - 0.5) * 1.2, 18, 35);
  humidity = clamp(humidity + (Math.random() - 0.5) * 4, 30, 90);
  const t = JSON.stringify({ value: Number(temperature.toFixed(1)) });
  const h = JSON.stringify({ value: Math.round(humidity) });
  client.publish(TOPICS.temperature, t);
  client.publish(TOPICS.humidity, h);
  log('→', TOPICS.temperature, t);
  log('→', TOPICS.humidity, h);
}

function publishLampState() {
  const payload = JSON.stringify({ state: lampState });
  // retain=true: o app mostra o estado assim que conectar
  client.publish(TOPICS.lampState, payload, { retain: true });
  log('→', TOPICS.lampState, payload);
}

let sensorTimer = null;

client.on('connect', () => {
  log(`Conectado a ${BROKER_URL}`);
  log(`Prefixo dos tópicos: ${PREFIX}`);
  client.subscribe(TOPICS.lampCommand, (err) => {
    if (err) log('Erro ao assinar comando:', err.message);
    else log('Escutando comandos em', TOPICS.lampCommand);
  });
  publishLampState();
  publishSensors();
  clearInterval(sensorTimer);
  sensorTimer = setInterval(publishSensors, 3000);
});

client.on('message', (topic, buffer) => {
  if (topic !== TOPICS.lampCommand) return;
  const raw = buffer.toString();
  log('←', topic, raw);
  let action;
  try {
    action = JSON.parse(raw)?.action;
  } catch {
    log('Comando ignorado: JSON inválido');
    return;
  }
  if (action !== 'ON' && action !== 'OFF') {
    log('Comando ignorado: ação desconhecida');
    return;
  }
  lampState = action;
  // pequeno atraso para simular o tempo de resposta do dispositivo
  setTimeout(publishLampState, 500);
});

client.on('reconnect', () => log('Reconectando ao broker...'));
client.on('error', (err) => log('Erro MQTT:', err.message));
client.on('offline', () => log('Offline'));

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (line) => {
  const cmd = line.trim().toLowerCase();
  if (cmd === 'bad') {
    client.publish(TOPICS.temperature, 'isto-nao-e-json');
    log('→ payload inválido publicado em', TOPICS.temperature);
  } else if (cmd === 'state') {
    publishLampState();
  } else if (cmd === 'quit') {
    shutdown();
  }
});

function shutdown() {
  clearInterval(sensorTimer);
  log('Encerrando simulador...');
  client.end(false, {}, () => process.exit(0));
}
process.on('SIGINT', shutdown);
