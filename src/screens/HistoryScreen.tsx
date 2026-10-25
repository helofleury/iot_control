import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { MessageItem } from '../components/MessageItem';
import { useMqtt } from '../context/MqttContext';
import { useSettings } from '../context/SettingsContext';
import { HISTORY_LIMIT } from '../config';

export function HistoryScreen() {
  const { colors } = useSettings();
  const { history } = useMqtt();

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      data={history}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MessageItem message={item} />}
      ListHeaderComponent={
        <Text style={[styles.header, { color: colors.textSecondary }]}>
          Últimas {HISTORY_LIMIT} mensagens (mais recente primeiro)
        </Text>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Nenhuma mensagem ainda. Inicie o simulador ou envie um comando.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, flexGrow: 1 },
  header: { fontSize: 13, marginBottom: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
