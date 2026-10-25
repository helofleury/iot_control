import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { LampAction, LampReading } from '../types/mqtt';
import { formatTime } from '../utils/format';
import { AppButton } from './AppButton';

interface Props {
  lamp: LampReading | null;
  pendingCommand: LampAction | null;
  onCommand: (action: LampAction) => void;
}

export function LampControl({ lamp, pendingCommand, onCommand }: Props) {
  const { colors } = useSettings();
  const isOn = lamp?.state === 'ON';
  const label = lamp ? (isOn ? 'Ligada' : 'Desligada') : 'Estado desconhecido';

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Text style={styles.bulb}>{isOn ? '💡' : '🔌'}</Text>
      <Text style={[styles.title, { color: colors.textSecondary }]}>Lâmpada</Text>
      <Text
        style={[
          styles.state,
          { color: isOn ? colors.success : colors.text },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.time, { color: colors.textSecondary }]}>
        {pendingCommand
          ? `Aguardando confirmação do dispositivo (${pendingCommand === 'ON' ? 'Ligar' : 'Desligar'})...`
          : lamp
            ? `Atualizado às ${formatTime(lamp.updatedAt)}`
            : 'Aguardando estado do dispositivo...'}
      </Text>

      <View style={styles.buttons}>
        <AppButton
          title="Ligar"
          style={styles.flex}
          loading={pendingCommand === 'ON'}
          disabled={pendingCommand !== null}
          onPress={() => onCommand('ON')}
        />
        <AppButton
          title="Desligar"
          variant="outline"
          style={styles.flex}
          loading={pendingCommand === 'OFF'}
          disabled={pendingCommand !== null}
          onPress={() => onCommand('OFF')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, alignItems: 'center' },
  bulb: { fontSize: 44 },
  title: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  state: { fontSize: 24, fontWeight: '800', marginTop: 4 },
  time: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16, alignSelf: 'stretch' },
  flex: { flex: 1 },
});
