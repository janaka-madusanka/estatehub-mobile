import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '../context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider
        value={
          colorScheme === 'dark'
            ? DarkTheme
            : DefaultTheme
        }
      >
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />

          <Stack.Screen name="login" />

          <Stack.Screen name="register" />
          <Stack.Screen name="chatbot" />
          <Stack.Screen
  name="property/[id]"
  options={{
    headerShown: false,
  }}
/>
   <Stack.Screen
    name="inquiry/create"
  />
  <Stack.Screen
  name="inquiry/[id]"
/>
<Stack.Screen
  name="my-property/[id]"
/>
<Stack.Screen
  name="my-property/create"
/>
<Stack.Screen
  name="my-property/edit/[id]"
/>

        </Stack>
     

        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}