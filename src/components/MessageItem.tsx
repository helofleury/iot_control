import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { HistoryMessage } from '../types/mqtt';
import { formatTime } from '../utils/format';

interface Props {
  message: HistoryMessage;
}

export function MessageItem({ message }: Props) {
  const { colors } = useSettings();
  const sent = message.direction === 'sent';
  const badgeColor = sent ? colors.primary : colors.success;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: colors.onPrimary }]}>
            {sent ? '↑ ENVIADA' : '↓ RECEBIDA'}
          </Text>
        </View>
        {!message.valid ? (
          <Text style={[styles.invalid, { color: colors.danger }]}>⚠ inválida</Text>
        ) : null}
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {formatTime(message.timestamp)}
        </Text>
      </View>
      <Text style={[styles.topic, { color: colors.textSecondary }]} numberOfLines={2}>
        {message.topic}
      </Text>
      <Text style={[styles.payload, { color: colors.text }]}>{message.payload}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  invalid: { fontSize: 12, fontWeight: '700' },
  time: { marginLeft: 'auto', fontSize: 12 },
  topic: { marginTop: 8, fontSize: 12 },
  payload: { marginTop: 4, fontSize: 15, fontFamily: 'monospace' },
});
