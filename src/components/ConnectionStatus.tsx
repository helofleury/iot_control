import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { ConnectionStatus as Status } from '../types/mqtt';

interface Props {
  status: Status;
  error: string | null;
}

const LABELS: Record<Status, string> = {
  connecting: 'Conectando...',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  error: 'Erro de conexão',
};

export function ConnectionStatus({ status, error }: Props) {
  const { colors } = useSettings();
  const color =
    status === 'connected'
      ? colors.success
      : status === 'connecting'
        ? colors.warning
        : status === 'error'
          ? colors.danger
          : colors.textSecondary;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.row}>
        {status === 'connecting' ? (
          <ActivityIndicator size="small" color={color} />
        ) : (
          <View style={[styles.dot, { backgroundColor: color }]} />
        )}
        <Text style={[styles.label, { color }]}>{LABELS[status]}</Text>
      </View>
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 14, borderWidth: 1, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontSize: 16, fontWeight: '700' },
  error: { marginTop: 8, fontSize: 13, lineHeight: 18 },
});
