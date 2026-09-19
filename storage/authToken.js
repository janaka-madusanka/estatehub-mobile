import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY =
  'estatehub_auth_token';

/**
 * Save the JWT token securely.
 */
export const saveAuthToken = async (
  token
) => {
  if (
    typeof token !== 'string' ||
    token.trim().length === 0
  ) {
    throw new Error(
      'A valid authentication token is required'
    );
  }

  await SecureStore.setItemAsync(
    AUTH_TOKEN_KEY,
    token.trim()
  );
};

/**
 * Read the saved JWT token.
 */
export const getAuthToken =
  async () => {
    return SecureStore.getItemAsync(
      AUTH_TOKEN_KEY
    );
  };

/**
 * Delete the JWT token during logout.
 */
export const removeAuthToken =
  async () => {
    await SecureStore.deleteItemAsync(
      AUTH_TOKEN_KEY
    );
  };