import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {
  router,
} from 'expo-router';

import {
  Ionicons,
} from '@expo/vector-icons';

export default function ChatbotFloatingButton() {
  return (
    <Pressable
      onPress={() =>
        router.push(
          '/chatbot'
        )
      }
      style={({
        pressed,
      }) => [
        styles.button,

        pressed &&
          styles.pressed,
      ]}
    >
      <Ionicons
        name="sparkles"
        size={20}
        color="#ffffff"
      />

      <Text
        style={
          styles.text
        }
      >
        AI
      </Text>
    </Pressable>
  );
}

const styles =
  StyleSheet.create({
    button: {
      position: 'absolute',

      right: 18,

      bottom: 18,

      minWidth: 64,

      height: 52,

      flexDirection: 'row',

      alignItems: 'center',

      justifyContent: 'center',

      gap: 6,

      borderRadius: 26,

      backgroundColor:
        '#047857',

      paddingHorizontal: 16,

      elevation: 8,

      zIndex: 100,
    },

    text: {
      color: '#ffffff',

      fontSize: 13,

      fontWeight: '900',
    },

    pressed: {
      opacity: 0.82,
    },
  });