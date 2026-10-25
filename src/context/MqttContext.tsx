import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { COMMAND_TIMEOUT_MS, HISTORY_LIMIT, TOPICS } from '../config';
import { mqttService } from '../services/mqttService';
import {
  ConnectionStatus,
  HistoryMessage,
  LampAction,
  LampReading,
  MessageDirection,
  PublishResult,
  SensorReading,
} from '../types/mqtt';
import {
  parseHumidity,
  parseLampState,
  parseTemperature,
} from '../utils/validators';
import { useSettings } from './SettingsContext';

interface MqttContextValue {
  status: ConnectionStatus;
  error: string | null;
  temperature: SensorReading | null;
  humidity: SensorReading | null;
  lamp: LampReading | null;
  /** Comando enviado e ainda sem confirmação de estado. */
  pendingCommand: LampAction | null;
  /** Aviso quando o comando não foi confirmado a tempo. */
  commandWarning: string | null;
  history: HistoryMessage[];
  connect: (url?: string) => void;
  disconnect: () => void;
  sendLampCommand: (action: LampAction) => PublishResult;
}

const MqttContext = createContext<MqttContextValue | undefined>(undefined);

let messageCounter = 0;
const nextId = (): string => `${Date.now()}-${messageCounter++}`;

export function MqttProvider({ children }: { children: ReactNode }) {
  const { brokerUrl, loaded } = useSettings();

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<SensorReading | null>(null);
  const [humidity, setHumidity] = useState<SensorReading | null>(null);
  const [lamp, setLamp] = useState<LampReading | null>(null);
  const [pendingCommand, setPendingCommand] = useState<LampAction | null>(null);
  const [commandWarning, setCommandWarning] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  const autoConnected = useRef(false);

  const addHistory = useCallback(
    (
      topic: string,
      payload: string,
      direction: MessageDirection,
      valid: boolean,
    ) => {
      const entry: HistoryMessage = {
        id: nextId(),
        topic,
        payload,
        direction,
        timestamp: Date.now(),
        valid,
      };
      setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    },
    [],
  );

  // Registra os listeners do serviço uma única vez e remove no unmount.
  useEffect(() => {
    const offStatus = mqttService.subscribeStatus((newStatus, newError) => {
      setStatus(newStatus);
      setError(newError ?? null);
    });

    const offMessages = mqttService.subscribeMessages((topic, payload) => {
      const now = Date.now();
      let valid = true;

      switch (topic) {
        case TOPICS.temperature: {
          const value = parseTemperature(payload);
          if (value === null) valid = false;
          else setTemperature({ value, updatedAt: now });
          break;
        }
        case TOPICS.humidity: {
          const value = parseHumidity(payload);
          if (value === null) valid = false;
          else setHumidity({ value, updatedAt: now });
          break;
        }
        case TOPICS.lampState: {
          const state = parseLampState(payload);
          if (state === null) {
            valid = false;
          } else {
            setLamp({ state, updatedAt: now });
            setPendingCommand(null);
            setCommandWarning(null);
          }
          break;
        }
        default:
          valid = false;
      }
      addHistory(topic, payload, 'received', valid);
    });

    return () => {
      offStatus();
      offMessages();
    };
  }, [addHistory]);

  // Conecta automaticamente ao abrir o app, depois de ler a URL salva.
  useEffect(() => {
    if (loaded && !autoConnected.current) {
      autoConnected.current = true;
      mqttService.connect(brokerUrl);
    }
  }, [loaded, brokerUrl]);

  // Se o comando não for confirmado pelo estado, avisa o usuário.
  useEffect(() => {
    if (!pendingCommand) return;
    const timer = setTimeout(() => {
      setPendingCommand(null);
      setCommandWarning(
        'O dispositivo não confirmou o comando. Verifique se o simulador está em execução.',
      );
    }, COMMAND_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [pendingCommand]);

  // Ao perder a conexão, descarta comando pendente.
  useEffect(() => {
    if (status !== 'connected') setPendingCommand(null);
  }, [status]);

  const connect = useCallback(
    (url?: string) => {
      mqttService.connect(url ?? brokerUrl);
    },
    [brokerUrl],
  );

  const disconnect = useCallback(() => {
    mqttService.disconnect();
  }, []);

  const sendLampCommand = useCallback(
    (action: LampAction): PublishResult => {
      if (!mqttService.isConnected()) {
        return {
          ok: false,
          reason: 'Sem conexão com o broker. Conecte-se antes de enviar comandos.',
        };
      }
      const payload = JSON.stringify({ action });
      try {
        mqttService.publish(TOPICS.lampCommand, payload);
      } catch (e) {
        return {
          ok: false,
          reason: e instanceof Error ? e.message : 'Falha ao publicar o comando.',
        };
      }
      addHistory(TOPICS.lampCommand, payload, 'sent', true);
      setCommandWarning(null);
      setPendingCommand(action);
      return { ok: true };
    },
    [addHistory],
  );

  const value = useMemo<MqttContextValue>(
    () => ({
      status,
      error,
      temperature,
      humidity,
      lamp,
      pendingCommand,
      commandWarning,
      history,
      connect,
      disconnect,
      sendLampCommand,
    }),
    [
      status,
      error,
      temperature,
      humidity,
      lamp,
      pendingCommand,
      commandWarning,
      history,
      connect,
      disconnect,
      sendLampCommand,
    ],
  );

  return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqtt(): MqttContextValue {
  const ctx = useContext(MqttContext);
  if (!ctx) throw new Error('useMqtt deve ser usado dentro de MqttProvider');
  return ctx;
}
