import { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { AuthState, AuthAction, User } from '../types/auth';
import { apiService } from '../services/apiService';

const TOKEN_KEY = 'token';

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
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
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
      };
    case 'VERIFY_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case 'VERIFY_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        isLoading: false,
        user: null,
        token: null,
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 