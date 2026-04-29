import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Info } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 保持真实的后端验证逻辑
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        login('user');
        navigate('/');
      } else {
        setError(data.message || '学号或密码错误');
      }
    } catch (err) {
      setError('无法连接到验证服务器，请确保后端已启动');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo className="h-14" />
          <h2 className="text-xl font-normal text-gray-800 mt-2">
            {isLogin ? '登录' : '创建账号'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? '使用您的校园账号继续，桃酥 AI 伴你左右' : '加入浙大专属学术资源流转平台'}
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="w-full p-8 border border-gray-200 rounded-[32px] bg-white shadow-sm">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="relative">
              <input 
                type="text" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="peer w-full h-12 border border-gray-300 rounded-lg px-4 pt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-transparent"
                placeholder=" "
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                学号 / 浙大邮箱
              </label>
            </div>

            <div className="relative">
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full h-12 border border-gray-300 rounded-lg px-4 pt-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-transparent"
                placeholder=" "
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                密码
              </label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-1">
                <Info className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                {isLogin ? '创建账号' : '已有账号？登录'}
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? '登录' : '注册'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center">
            <p className="text-xs text-gray-400">
                本系统仅限浙江大学在校师生使用<br/>
                登录即代表您同意《浙里淘书服务协议》
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
