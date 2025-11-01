import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { FileText, Lock, User, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const setAuthState = useAuthStore((state) => state.setAuthState);

  useEffect(() => {
    // 清除之前的错误提示
    return () => {
      // 清理函数
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error('请输入用户名');
      return;
    }
    
    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(username.trim(), password);
      
      if (result.success && result.token && result.user) {
        toast.success('登录成功');
        // 延迟1秒后更新认证状态，实现延迟跳转
        setTimeout(() => {
          setAuthState(result.token!, result.user!);
          // 页面跳转后会自动卸载组件，所以不需要重置isLoading
        }, 1000);
      } else {
        toast.error(result.message || '登录失败');
        setIsLoading(false);
      }
    } catch (error) {
      toast.error('登录失败，请稍后重试');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo和标题 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">文件管理系统</h1>
            <p className="text-gray-600">请登录您的账户</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="username"
                type="text"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-11"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                disabled={isLoading}
                autoComplete="current-password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>

          {/* 提示信息 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium mb-2">测试账号：</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 用户名: admin，密码: password</li>
              <li>• 用户名: user1，密码: password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

