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
  useEffect,
  useState,
} from 'react';

import {
  Link,
  router,
} from 'expo-router';

import useAuth from '../context/AuthContext';

export default function LoginScreen() {
  const {
    user,
    initializing,
    signIn,
  } = useAuth();

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  useEffect(() => {
    if (
      !initializing &&
      user
    ) {
      router.replace('/');
    }
  }, [
    initializing,
    user,
  ]);

  const handleLogin =
    async () => {
      const cleanEmail =
        email.trim();

      if (
        !cleanEmail ||
        !password
      ) {
        setError(
          'Email and password are required.'
        );

        return;
      }

      setSubmitting(true);
      setError('');

      try {
        await signIn({
          email: cleanEmail,
          password,
        });

        router.replace('/');
      } catch (requestError) {
        setError(
          requestError instanceof
          Error
            ? requestError.message
            : 'Unable to log in'
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (initializing) {
    return (
      <SafeAreaView
        style={styles.centered}
      >
        <ActivityIndicator
          size="large"
          color="#047857"
        />
      </SafeAreaView>
    );
  }

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
          <View
            style={styles.brandSection}
          >
            <Text style={styles.brand}>
              EstateHub
            </Text>

            <Text style={styles.title}>
              Welcome back
            </Text>

            <Text
              style={styles.subtitle}
            >
              Log in to manage properties
              and communicate with owners
              and buyers.
            </Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>
                Email address
              </Text>

              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);

                  if (error) {
                    setError('');
                  }
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="#94a3b8"
                editable={!submitting}
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>
                Password
              </Text>

              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);

                  if (error) {
                    setError('');
                  }
                }}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                editable={!submitting}
                style={styles.input}
              />
            </View>

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
              onPress={handleLogin}
              disabled={submitting}
              style={({ pressed }) => [
                styles.primaryButton,

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
                      styles.primaryButtonText
                    }
                  >
                    Logging in...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Login
                </Text>
              )}
            </Pressable>

            <View
              style={styles.registerRow}
            >
              <Text
                style={styles.helperText}
              >
                Do not have an account?
              </Text>

              <Link
                href="/register"
                style={styles.link}
              >
                Create account
              </Link>
            </View>

            <Pressable
              onPress={() =>
                router.replace('/')
              }
              style={
                styles.browseButton
              }
            >
              <Text
                style={
                  styles.browseButtonText
                }
              >
                Continue without login
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    screen: {
      flex: 1,
      backgroundColor:
        '#f8fafc',
    },

    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#f8fafc',
    },

    container: {
      flexGrow: 1,
      justifyContent:
        'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },

    brandSection: {
      marginBottom: 32,
    },

    brand: {
      color: '#047857',
      fontSize: 17,
      fontWeight: '800',
    },

    title: {
      marginTop: 10,
      color: '#0f172a',
      fontSize: 32,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 10,
      color: '#64748b',
      fontSize: 15,
      lineHeight: 23,
    },

    form: {
      gap: 20,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 22,
      backgroundColor:
        '#ffffff',
      padding: 22,
    },

    label: {
      marginBottom: 8,
      color: '#334155',
      fontSize: 14,
      fontWeight: '700',
    },

    input: {
      height: 52,
      borderWidth: 1,
      borderColor: '#cbd5e1',
      borderRadius: 13,
      backgroundColor:
        '#ffffff',
      paddingHorizontal: 15,
      color: '#0f172a',
      fontSize: 16,
    },

    errorBox: {
      borderWidth: 1,
      borderColor: '#fecaca',
      borderRadius: 12,
      backgroundColor:
        '#fef2f2',
      padding: 12,
    },

    errorText: {
      color: '#b91c1c',
      fontSize: 14,
      lineHeight: 20,
    },

    primaryButton: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 9,
      borderRadius: 13,
      backgroundColor:
        '#047857',
      paddingHorizontal: 18,
    },

    buttonPressed: {
      opacity: 0.85,
    },

    buttonDisabled: {
      backgroundColor:
        '#94a3b8',
    },

    primaryButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '800',
    },

    registerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent:
        'center',
      gap: 5,
    },

    helperText: {
      color: '#64748b',
      fontSize: 14,
    },

    link: {
      color: '#047857',
      fontSize: 14,
      fontWeight: '800',
    },

    browseButton: {
      minHeight: 48,
      alignItems: 'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor: '#047857',
      borderRadius: 13,
    },

    browseButtonText: {
      color: '#047857',
      fontSize: 15,
      fontWeight: '700',
    },
  });