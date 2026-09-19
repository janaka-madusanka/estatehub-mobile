import { useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  router,
  useLocalSearchParams,
} from 'expo-router';

import {
  createInquiry,
} from '../../api/inquiries';

import useAuth from '../../context/AuthContext';

export default function CreateInquiryScreen() {
  const { user } = useAuth();

  const params =
    useLocalSearchParams<{
      propertyId?: string | string[];
      propertyTitle?: string | string[];
    }>();

  const propertyId =
    Array.isArray(params.propertyId)
      ? params.propertyId[0]
      : params.propertyId;

  const propertyTitle =
    Array.isArray(params.propertyTitle)
      ? params.propertyTitle[0]
      : params.propertyTitle;

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = async () => {
    if (!user) {
      router.replace('/login');
      return;
    }

    if (!propertyId) {
      setError(
        'Property information is missing.'
      );
      return;
    }

    const cleanMessage =
      message.trim();

    if (cleanMessage.length < 2) {
      setError(
        'Please enter at least 2 characters.'
      );
      return;
    }

    if (cleanMessage.length > 2000) {
      setError(
        'Message cannot contain more than 2000 characters.'
      );
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const inquiry =
  await createInquiry({
    propertyId,
    message: cleanMessage,
  });

if (!inquiry?._id) {
  throw new Error(
    'Inquiry was created but the inquiry ID was not returned.'
  );
}

router.replace({
  pathname:
    '/inquiry/[id]',

  params: {
    id: inquiry._id,
  },
});
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unable to send inquiry';

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.screen}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.container
          }
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <Pressable
              onPress={() =>
                router.back()
              }
              style={
                styles.backButton
              }
            >
              <Text
                style={
                  styles.backButtonText
                }
              >
                ←
              </Text>
            </Pressable>

            <Text
              style={
                styles.topBarTitle
              }
            >
              Contact Owner
            </Text>

            <View
              style={
                styles.topBarSpacer
              }
            />
          </View>

          <View
            style={styles.content}
          >
            <Text
              style={styles.label}
            >
              Property
            </Text>

            <View
              style={
                styles.propertyBox
              }
            >
              <Text
                style={
                  styles.propertyTitle
                }
              >
                {propertyTitle ||
                  'EstateHub Property'}
              </Text>
            </View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Send an inquiry
            </Text>

            <Text
              style={
                styles.description
              }
            >
              Write a message to the
              property owner. You can
              continue the conversation
              after the inquiry is sent.
            </Text>

            <Text
              style={
                styles.inputLabel
              }
            >
              Message
            </Text>

            <TextInput
              value={message}
              onChangeText={(value) => {
                setMessage(value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Example: Hi, I am interested in this property. Is it still available?"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={7}
              maxLength={2000}
              textAlignVertical="top"
              editable={!submitting}
              style={styles.input}
            />

            <Text
              style={
                styles.characterCount
              }
            >
              {message.length}/2000
            </Text>

            {error ? (
              <View
                style={styles.errorBox}
              >
                <Text
                  style={
                    styles.errorText
                  }
                >
                  {error}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.sendButton,

                pressed &&
                  !submitting &&
                  styles.buttonPressed,

                submitting &&
                  styles.buttonDisabled,
              ]}
            >
              {submitting ? (
                <>
                  <ActivityIndicator
                    size="small"
                    color="#ffffff"
                  />

                  <Text
                    style={
                      styles.sendButtonText
                    }
                  >
                    Sending...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.sendButtonText
                  }
                >
                  Send Inquiry
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  container: {
    flexGrow: 1,
  },

  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
  },

  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },

  backButtonText: {
    color: '#0f172a',
    fontSize: 25,
    fontWeight: '700',
  },

  topBarTitle: {
    flex: 1,
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  topBarSpacer: {
    width: 42,
  },

  content: {
    padding: 22,
  },

  label: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },

  propertyBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    padding: 16,
  },

  propertyTitle: {
    color: '#065f46',
    fontSize: 16,
    fontWeight: '800',
  },

  sectionTitle: {
    marginTop: 28,
    color: '#0f172a',
    fontSize: 24,
    fontWeight: '800',
  },

  description: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 14,
    lineHeight: 22,
  },

  inputLabel: {
    marginTop: 24,
    marginBottom: 8,
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },

  input: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 15,
    backgroundColor: '#ffffff',
    padding: 15,
    color: '#0f172a',
    fontSize: 15,
    lineHeight: 22,
  },

  characterCount: {
    marginTop: 7,
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'right',
  },

  errorBox: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    padding: 12,
  },

  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    lineHeight: 20,
  },

  sendButton: {
    minHeight: 54,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: '#047857',
    paddingHorizontal: 20,
  },

  sendButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
});