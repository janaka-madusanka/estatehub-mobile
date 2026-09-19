import axios from 'axios';

import {
  getAuthToken,
} from '../storage/authToken';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL;

if (!baseURL) {
  console.warn(
    'EXPO_PUBLIC_API_URL is missing from the .env file'
  );
}

const api = axios.create({
  baseURL,
  timeout: 15000,

  headers: {
    'Content-Type':
      'application/json',
  },
});

/**
 * Automatically attach the saved JWT token.
 */
api.interceptors.request.use(
  async (config) => {
    const token =
      await getAuthToken();

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

/**
 * Convert API errors into a consistent structure.
 */
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const payload =
      error.response?.data;

    const normalizedError =
      new Error(
        payload?.message ||
          error.message ||
          'Something went wrong'
      );

    normalizedError.status =
      error.response?.status;

    normalizedError.fields =
      payload?.errors || [];

    return Promise.reject(
      normalizedError
    );
  }
);

export default api;