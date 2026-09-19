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

export default function RegisterScreen() {
  const {
    user,
    initializing,
    signUp,
  } = useAuth();

  const [
    name,
    setName,
  ] = useState('');

  const [
    email,
    setEmail,
  ] = useState('');

  const [
    password,
    setPassword,
  ] = useState('');

  const [
    confirmPassword,
    setConfirmPassword,
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

  const handleRegister =
    async () => {
      const cleanName =
        name.trim();

      const cleanEmail =
        email.trim();

      if (
        !cleanName ||
        !cleanEmail ||
        !password ||
        !confirmPassword
      ) {
        setError(
          'Please complete every field.'
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setError(
          'Passwords do not match.'
        );

        return;
      }

      setSubmitting(true);
      setError('');

      try {
        await signUp({
          name: cleanName,
          email: cleanEmail,
          password,
        });

        router.replace('/');
      } catch (requestError) {
        setError(
          requestError instanceof
          Error
            ? requestError.message
            : 'Unable to create account'
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
              Create your account
            </Text>

            <Text
              style={styles.subtitle}
            >
              Register to contact property
              owners and manage your own
              property listings.
            </Text>
          </View>

          <View style={styles.form}>
            <FormField
              label="Full name"
              value={name}
              onChangeText={(value) => {
                setName(value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Enter your full name"
              editable={!submitting}
            />

            <FormField
              label="Email address"
              value={email}
              onChangeText={(value) => {
                setEmail(value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!submitting}
            />

            <FormField
              label="Password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Create a password"
              secureTextEntry
              autoCapitalize="none"
              editable={!submitting}
            />

            <FormField
              label="Confirm password"
              value={
                confirmPassword
              }
              onChangeText={(value) => {
                setConfirmPassword(
                  value
                );

                if (error) {
                  setError('');
                }
              }}
              placeholder="Enter password again"
              secureTextEntry
              autoCapitalize="none"
              editable={!submitting}
            />

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
              onPress={
                handleRegister
              }
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
                    Creating account...
                  </Text>
                </>
              ) : (
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Create account
                </Text>
              )}
            </Pressable>

            <View
              style={styles.loginRow}
            >
              <Text
                style={styles.helperText}
              >
                Already have an account?
              </Text>

              <Link
                href="/login"
                style={styles.link}
              >
                Login
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  ...inputProps
}) {
  return (
    <View>
      <Text style={styles.label}>
        {label}
      </Text>

      <TextInput
        {...inputProps}
        autoCorrect={false}
        placeholderTextColor="#94a3b8"
        style={styles.input}
      />
    </View>
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
      marginBottom: 30,
    },

    brand: {
      color: '#047857',
      fontSize: 17,
      fontWeight: '800',
    },

    title: {
      marginTop: 10,
      color: '#0f172a',
      fontSize: 31,
      fontWeight: '800',
    },

    subtitle: {
      marginTop: 10,
      color: '#64748b',
      fontSize: 15,
      lineHeight: 23,
    },

    form: {
      gap: 18,
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

    loginRow: {
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
  });