import React, { createContext, useState, useEffect, FC, Dispatch, SetStateAction } from 'react';
import { UserModel } from './_models';
import { AuthModel } from './_models';
import * as authHelper from './AuthHelpers';
import { getUserByToken } from './_requests';

type AuthContextProps = {
  auth: AuthModel | undefined;
  saveAuth: (auth: AuthModel | undefined) => void;
  currentUser: UserModel | undefined;
  setCurrentUser: Dispatch<SetStateAction<UserModel | undefined>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type WithChildren = {
  children: React.ReactNode;
};

export const AuthProvider: FC<WithChildren> = ({ children }) => {
  const [auth, setAuth] = useState<AuthModel | undefined>(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState<UserModel | undefined>();

  const saveAuth = (auth: AuthModel | undefined) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const logout = () => {
    saveAuth(undefined);
    setCurrentUser(undefined);
  };

  return (
    <AuthContext.Provider value={{ auth, saveAuth, currentUser, setCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthInit: FC<WithChildren> = ({ children }) => {
  const { auth, currentUser, logout, setCurrentUser } = useAuth();
  const [showSplashScreen, setShowSplashScreen] = useState(true);

  useEffect(() => {
    const requestUser = async (apiToken: string) => {
      try {
        if (!currentUser) {
          const { data } = await getUserByToken(apiToken);
          if (data) {
            setCurrentUser(data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Token might be invalid, clear auth
        logout();
      } finally {
        setShowSplashScreen(false);
      }
    };

    if (auth && auth.api_token) {
      requestUser(auth.api_token);
    } else {
      setShowSplashScreen(false);
    }
  }, []);

  if (showSplashScreen) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spinner 0.6s linear infinite',
          }}
        ></div>
        <div style={{ color: '#64748b' }}>Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

