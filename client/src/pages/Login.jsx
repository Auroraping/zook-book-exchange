import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import Logo from '../components/Logo';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (role = 'user') => {
    login(role);
    setTimeout(() => {
      navigate('/');
    }, 600);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin('user');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <Logo className="h-14" />
          <h2 className="text-xl font-normal text-google-gray mt-2">
            {isLogin ? '登录' : '创建账号'}
          </h2>
          <p className="text-sm text-google-gray/70 mt-1">
            {isLogin ? '使用您的校园账号继续，桃酥 AI 伴你左右' : '加入浙大专属学术资源流转平台'}
          </p>
        </div>

        {/* 表单卡片 */}
        <div className="google-card w-full p-8 border-google-border/60">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {!isLogin && (
              <div className="relative">
                <input 
                  type="text" 
                  required 
                  className="peer w-full h-12 border border-google-border rounded-google-sm px-4 pt-2 text-google-gray focus:outline-none focus:ring-2 focus:ring-google-blue/20 focus:border-google-blue transition-all bg-transparent"
                  placeholder=" "
                />
                <label className="absolute left-4 top-1/2 -translate-y-1/2 text-google-gray/50 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-google-blue peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                  学号 / 教工号
                </label>
              </div>
            )}
            
            <div className="relative">
              <input 
                type="text" 
                required 
                className="peer w-full h-12 border border-google-border rounded-google-sm px-4 pt-2 text-google-gray focus:outline-none focus:ring-2 focus:ring-google-blue/20 focus:border-google-blue transition-all bg-transparent"
                placeholder=" "
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-google-gray/50 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-google-blue peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                {isLogin ? '学号 / 浙大邮箱' : '浙大专属认证邮箱'}
              </label>
            </div>

            <div className="relative">
              <input 
                type="password" 
                required 
                className="peer w-full h-12 border border-google-border rounded-google-sm px-4 pt-2 text-google-gray focus:outline-none focus:ring-2 focus:ring-google-blue/20 focus:border-google-blue transition-all bg-transparent"
                placeholder=" "
              />
              <label className="absolute left-4 top-1/2 -translate-y-1/2 text-google-gray/50 text-sm transition-all peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-google-blue peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px]">
                密码
              </label>
            </div>

            <div className="flex justify-between items-center mt-2">
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-google-blue font-medium hover:underline"
              >
                {isLogin ? '创建账号' : '已有账号？登录'}
              </button>
              <button type="submit" className="google-btn-primary">
                {isLogin ? '登录' : '注册'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部信息 */}
        <div className="mt-12 text-center">
            <p className="text-xs text-google-gray/40">
                本系统仅限浙江大学在校师生使用<br/>
                登录即代表您同意《浙里淘书服务协议》
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
