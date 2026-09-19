import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  getMe,
  login as loginRequest,
  register as registerRequest,
} from '../api/auth';

import {
  getAuthToken,
  removeAuthToken,
  saveAuthToken,
} from '../storage/authToken';

/* =====================================================
   TYPES
===================================================== */

export type AuthUser = {
  _id?: string;

  id?: string;

  name: string;

  email: string;

  role?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthContextValue = {
  user: AuthUser | null;

  initializing: boolean;

  authenticated: boolean;

  signIn: (
    credentials: LoginInput
  ) => Promise<AuthResponse>;

  signUp: (
    registrationData: RegisterInput
  ) => Promise<AuthResponse>;

  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

/* =====================================================
   CONTEXT
===================================================== */

const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

/* =====================================================
   PROVIDER
===================================================== */

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<AuthUser | null>(
      null
    );

  const [
    initializing,
    setInitializing,
  ] = useState(true);

  /* ===================================================
     RESTORE LOGIN SESSION
  =================================================== */

  useEffect(() => {
    let cancelled = false;

    const restoreSession =
      async () => {
        try {
          const token =
            await getAuthToken();

          if (!token) {
            return;
          }

          const data =
            await getMe();

          /*
           * Backend may return:
           *
           * data.user
           *
           * or the user directly.
           */

          const restoredUser =
            (data?.user ||
              data) as
              | AuthUser
              | undefined;

          if (
            !cancelled
          ) {
            setUser(
              restoredUser ||
                null
            );
          }
        } catch (error) {
          await removeAuthToken();

          if (
            !cancelled
          ) {
            setUser(null);
          }
        } finally {
          if (
            !cancelled
          ) {
            setInitializing(
              false
            );
          }
        }
      };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===================================================
     LOGIN
  =================================================== */

  const signIn = async ({
    email,
    password,
  }: LoginInput): Promise<AuthResponse> => {
    const data =
      (await loginRequest({
        email,
        password,
      })) as AuthResponse;

    if (
      !data?.token ||
      !data?.user
    ) {
      throw new Error(
        'Invalid login response from the server'
      );
    }

    await saveAuthToken(
      data.token
    );

    setUser(data.user);

    return data;
  };

  /* ===================================================
     REGISTER
  =================================================== */

  const signUp = async ({
    name,
    email,
    password,
  }: RegisterInput): Promise<AuthResponse> => {
    const data =
      (await registerRequest({
        name,
        email,
        password,
      })) as AuthResponse;

    if (
      !data?.token ||
      !data?.user
    ) {
      throw new Error(
        'Invalid registration response from the server'
      );
    }

    await saveAuthToken(
      data.token
    );

    setUser(data.user);

    return data;
  };

  /* ===================================================
     LOGOUT
  =================================================== */

  const signOut =
    async () => {
      await removeAuthToken();

      setUser(null);
    };

  /* ===================================================
     CONTEXT VALUE
  =================================================== */

  const value =
    useMemo<AuthContextValue>(
      () => ({
        user,

        initializing,

        authenticated:
          Boolean(user),

        signIn,

        signUp,

        signOut,
      }),
      [
        user,
        initializing,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =====================================================
   HOOK
===================================================== */

export default function useAuth(): AuthContextValue {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}