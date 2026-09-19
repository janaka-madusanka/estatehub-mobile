import api from './client';

/**
 * POST /api/auth/register
 */
export const register = async ({
  name,
  email,
  password,
}) => {
  const response = await api.post(
    '/auth/register',
    {
      name: name.trim(),
      email: email
        .trim()
        .toLowerCase(),
      password,
    }
  );

  return response.data.data;
};

/**
 * POST /api/auth/login
 */
export const login = async ({
  email,
  password,
}) => {
  const response = await api.post(
    '/auth/login',
    {
      email: email
        .trim()
        .toLowerCase(),
      password,
    }
  );

  return response.data.data;
};

/**
 * GET /api/auth/me
 */
export const getMe = async () => {
  const response = await api.get(
    '/auth/me'
  );

  return response.data.data;
};