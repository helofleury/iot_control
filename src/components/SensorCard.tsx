import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { SensorReading } from '../types/mqtt';
import { formatTime } from '../utils/format';

interface Props {
  title: string;
  icon: string;
  unit: string;
  reading: SensorReading | null;
  decimals?: number;
}

export function SensorCard({ title, icon, unit, reading, decimals = 1 }: Props) {
  const { colors } = useSettings();
  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {reading ? `${reading.value.toFixed(decimals)}${unit}` : '--'}
      </Text>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {reading ? `Atualizado às ${formatTime(reading.updatedAt)}` : 'Aguardando leitura...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  icon: { fontSize: 28 },
  title: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  value: { fontSize: 30, fontWeight: '800', marginVertical: 6 },
  time: { fontSize: 11, textAlign: 'center' },
});
