import { useEffect } from 'react';
import FileManager from './components/FileManage';
import Login from './components/Login';
import { Toaster } from 'sonner';
import { useAuthStore } from '@/store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    // 初始化认证状态（从localStorage恢复token）
    initAuth();
  }, [initAuth]);

  return (
    <>
      {isAuthenticated ? (
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="container mx-auto">
            <FileManager />
          </div>
        </div>
      ) : (
        <Login />
      )}
      <Toaster 
        position="top-left" 
        closeButton
        richColors
        expand 
        theme="light"
      />
    </>
  );
}

export default App;
