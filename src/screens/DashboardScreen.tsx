import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { LampControl } from '../components/LampControl';
import { SensorCard } from '../components/SensorCard';
import { useMqtt } from '../context/MqttContext';
import { useSettings } from '../context/SettingsContext';
import { LampAction } from '../types/mqtt';

export function DashboardScreen() {
  const { colors } = useSettings();
  const {
    status,
    error,
    temperature,
    humidity,
    lamp,
    pendingCommand,
    commandWarning,
    connect,
    sendLampCommand,
  } = useMqtt();
  const [feedback, setFeedback] = useState<string | null>(null);

  // Some o aviso de feedback depois de alguns segundos.
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 5000);
    return () => clearTimeout(timer);
  }, [feedback]);

  const handleCommand = (action: LampAction) => {
    const result = sendLampCommand(action);
    setFeedback(result.ok ? null : (result.reason ?? 'Falha ao enviar comando.'));
  };

  const warning = feedback ?? commandWarning;
  const canReconnect = status === 'disconnected' || status === 'error';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <ConnectionStatus status={status} error={error} />

      {canReconnect ? (
        <AppButton title="Reconectar agora" onPress={() => connect()} />
      ) : null}

      {warning ? (
        <View
          style={[
            styles.banner,
            { borderColor: colors.warning, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.bannerText, { color: colors.warning }]}>⚠ {warning}</Text>
        </View>
      ) : null}

      <View style={styles.row}>
        <SensorCard title="Temperatura" icon="🌡️" unit=" °C" reading={temperature} />
        <SensorCard title="Umidade" icon="💧" unit=" %" reading={humidity} decimals={0} />
      </View>

      <LampControl
        lamp={lamp}
        pendingCommand={pendingCommand}
        onCommand={handleCommand}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 12 },
  banner: { borderWidth: 1.5, borderRadius: 12, padding: 12 },
  bannerText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
