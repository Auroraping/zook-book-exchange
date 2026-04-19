import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('buyer'); // 添加角色状态
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(); // 更新全局模拟状态
    setTimeout(() => {
      // 根据角色分流
      if (role === 'seller') {
        navigate('/publish');
      } else {
        navigate('/');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
      {/* 浙大蓝色装饰大圆背景 */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-zju-light rounded-full opacity-50 blur-3xl mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-blue-100/50 rounded-full opacity-50 blur-3xl mix-blend-multiply"></div>

      <div className="relative z-10 flex w-[900px] h-[550px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* 左侧形象区 */}
        <div className="w-5/12 bg-zju-blue text-white p-12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/zju_campus_bg.png')] mix-blend-overlay opacity-30 bg-cover bg-center"></div>
          <div className="relative z-10 flex items-center gap-3">
            <BookOpen className="w-10 h-10" />
            <h1 className="text-3xl font-serif font-bold tracking-widest">求书</h1>
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-4 leading-snug">连接全校知识，<br/>让教材新生。</h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              这是属于浙江大学师生自己的二手交易与知识共享中枢。每一本书的流转，都是对环保与学术传承的致敬。
            </p>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="w-7/12 p-14 flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{isLogin ? '欢迎回到求书平台' : '注册浙大校园新账号'}</h2>
          <p className="text-sm text-gray-500 mb-6">{isLogin ? '请使用统一身份认证或绑定邮箱登录' : '为保证社区纯净，仅限 *.zju.edu.cn 邮箱'}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* 角色选项卡 */}
            <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
              <button 
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${role === 'buyer' ? 'bg-white text-zju-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我是买家 (淘学长教材)
              </button>
              <button 
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-all ${role === 'seller' ? 'bg-white text-zju-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                我是卖家 (清期末闲置)
              </button>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学号 / 教工号</label>
                <input type="text" required className="w-full h-10 border border-gray-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-zju-blue/50 focus:border-zju-blue transition-all" placeholder="如：320010XXXX" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{isLogin ? '学号 / 浙大邮箱' : '浙大专属认证邮箱'}</label>
              <input type="text" required className="w-full h-10 border border-gray-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-zju-blue/50 focus:border-zju-blue transition-all" placeholder={isLogin ? '请输入账号' : 'example@zju.edu.cn'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input type="password" required className="w-full h-10 border border-gray-300 rounded-lg px-4 text-sm focus:outline-none focus:ring-2 focus:ring-zju-blue/50 focus:border-zju-blue transition-all" placeholder="••••••••" />
            </div>
            
            <button type="submit" className="mt-2 w-full h-11 bg-zju-blue text-white rounded-lg font-bold hover:bg-zju-hover hover:shadow-lg hover:shadow-zju-blue/30 transition-all flex items-center justify-center gap-2">
               {isLogin ? `登录系统 (${role === 'buyer' ? '买家版' : '卖家版'})` : '完成高校身份验证并注册'}
            </button>
            
            <button type="button" onClick={handleSubmit} className="w-full h-12 bg-[#f8fafc] text-gray-700 border border-gray-200 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
               <ShieldCheck className="w-5 h-5 text-green-600" />
               CAS 统一身份一键登录 (模拟)
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium">
            <span className="text-gray-500">{isLogin ? "还没有校园账号？" : "已有求书账号？"} </span>
            <span onClick={() => setIsLogin(!isLogin)} className="text-zju-blue cursor-pointer hover:underline">
              {isLogin ? "立即实名注册" : "返回密码登录"}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
