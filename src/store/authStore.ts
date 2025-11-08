import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';

interface AuthStore {
  token: string | null;
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
  } | null;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string; token?: string; user?: { id: number; username: string } }>;
  setAuthState: (token: string, user: { id: number; username: string }) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        isAuthenticated: false,
        user: null,
        
        login: async (username: string, password: string) => {
          try {
            const response = await axios.post('/api/auth/login', {
              username,
              password,
            });
            
            const data = response.data;
            
            if (data.code === 200 && data.data?.token) {
              const token = data.data.token;
              
              // 解析token获取用户信息（这里简化处理，实际应该从token中解析或从API获取）
              try {
                const tokenParts = token.split('.');
                if (tokenParts.length > 1) {
                  const payload = JSON.parse(atob(tokenParts[1]));
                  return {
                    success: true,
                    token,
                    user: {
                      id: payload.sub || 0,
                      username: payload.username || username,
                    },
                  };
                }
              } catch (e) {
                // token解析失败，但仍保存token
              }
              
              // token解析失败或格式不正确，但仍保存token
              return {
                success: true,
                token,
                user: {
                  id: 0,
                  username,
                },
              };
            } else {
              return {
                success: false,
                message: data.message || '登录失败，请检查用户名和密码',
              };
            }
          } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || '登录失败，请稍后重试';
            return {
              success: false,
              message,
            };
          }
        },
        
        setAuthState: (token: string, user: { id: number; username: string }) => {
          set({
            token,
            isAuthenticated: true,
            user,
          });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        },
        
        logout: () => {
          set({
            token: null,
            isAuthenticated: false,
            user: null,
          });
          delete axios.defaults.headers.common['Authorization'];
        },
        
        initAuth: () => {
          const state = useAuthStore.getState();
          if (state.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          }
        },
      }),
      {
        name: 'auth-storage',
        onRehydrateStorage: () => (state) => {
          if (state?.token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          }
        },
      }
    ),
    { name: 'authStore' }
  )
);

