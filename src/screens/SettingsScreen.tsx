import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useMqtt } from '../context/MqttContext';
import { useSettings } from '../context/SettingsContext';
import { parseBrokerUrl } from '../services/mqttService';
import { TOPIC_PREFIX } from '../config';

export function SettingsScreen() {
  const { colors, brokerUrl, themeMode, updateBrokerUrl, updateThemeMode } =
    useSettings();
  const { status, error, connect, disconnect } = useMqtt();
  const [draftUrl, setDraftUrl] = useState(brokerUrl);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sincroniza o campo quando a URL salva é carregada do AsyncStorage.
  useEffect(() => {
    setDraftUrl(brokerUrl);
  }, [brokerUrl]);

  const isConnected = status === 'connected' || status === 'connecting';

  const handleSaveAndConnect = () => {
    const url = draftUrl.trim();
    if (!parseBrokerUrl(url)) {
      setValidationError(
        'URL inválida. Exemplo: wss://broker.hivemq.com:8884/mqtt (não use mqtt:// nem a porta 1883).',
      );
      return;
    }
    setValidationError(null);
    updateBrokerUrl(url);
    connect(url);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <ConnectionStatus status={status} error={error} />

        <View
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.label, { color: colors.text }]}>URL WebSocket do broker</Text>
          <TextInput
            value={draftUrl}
            onChangeText={setDraftUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="wss://broker.hivemq.com:8884/mqtt"
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: validationError ? colors.danger : colors.border,
                backgroundColor: colors.inputBackground,
              },
            ]}
          />
          {validationError ? (
            <Text style={[styles.error, { color: colors.danger }]}>{validationError}</Text>
          ) : (
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Use ws:// ou wss:// com a porta WebSocket (ex.: 8884). A porta TCP 1883 não funciona aqui.
            </Text>
          )}

          <View style={styles.buttons}>
            <AppButton
              title={status === 'connecting' ? 'Conectando' : 'Salvar e conectar'}
              loading={status === 'connecting'}
              onPress={handleSaveAndConnect}
              style={styles.flex}
            />
            <AppButton
              title="Desconectar"
              variant="outline"
              disabled={!isConnected}
              onPress={disconnect}
              style={styles.flex}
            />
          </View>
        </View>

        <View
          style={[
            styles.card,
            styles.themeRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.flex}>
            <Text style={[styles.label, { color: colors.text }]}>Tema escuro</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Preferência salva no dispositivo.
            </Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(on) => updateThemeMode(on ? 'dark' : 'light')}
            trackColor={{ true: colors.primary, false: colors.border }}
          />
        </View>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Prefixo dos tópicos: {TOPIC_PREFIX}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
  },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  error: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
