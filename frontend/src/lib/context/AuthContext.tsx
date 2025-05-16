import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AuthAction, User } from '../types/auth';
import { apiService } from '../services/apiService';

const TOKEN_KEY = 'access_token';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  error: null
};

const AuthContext = createContext<{
  state: AuthState;
  dispatch: React.Dispatch<AuthAction>;
} | null>(null);

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: action.payload.error
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: null
      };
    case 'LOADING':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'VERIFY_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
        error: null
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    let mounted = true;

    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          if (mounted) {
            dispatch({ type: 'VERIFY_FAILURE' });
          }
          return;
        }

        const result = await apiService.verifyAuth();
        if (!mounted) return;
        
        if (result) {
          dispatch({ type: 'VERIFY_SUCCESS', payload: result });
        } else {
          dispatch({ type: 'VERIFY_FAILURE' });
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        if (mounted) {
          dispatch({ type: 'VERIFY_FAILURE' });
        }
      }
    };

    verifyAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 