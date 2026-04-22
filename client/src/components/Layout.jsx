import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageSquare, User, Bell, PackagePlus, LogOut, ShieldCheck } from 'lucide-react';

import { useAuth } from './AuthContext';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isLoggedIn, logout } = useAuth();

  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // 模拟判断是否处在登录页，若是则全屏隐藏 Layout Nav（根据业务逻辑，登录页不需要顶部导航栏）
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-50"><Outlet /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8fc]">
      {/* 现代毛玻璃导航栏 */}
      <header className="sticky top-0 z-50 glass-header">
        <div className="max-w-[1440px] mx-auto px-8 h-[80px] flex items-center justify-between gap-4">
          
          {/* 品牌 Logo 区 */}
          <div className="flex items-center gap-6 flex-shrink-0">
            <Link to="/" className="group flex items-center gap-3">
              <div className="bg-zju-blue text-white p-2 rounded-xl shadow-lg shadow-zju-blue/20 group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-serif font-black text-zju-blue tracking-tighter">求书</span>
                <span className="text-[9px] text-gray-400 font-bold tracking-[0.2em] mt-[-2px] uppercase">ZJU Used Book</span>
              </div>
            </Link>
            
            <div className="hidden xl:block h-8 w-[1px] bg-gray-100 mx-2"></div>
            
            <div className="hidden xl:flex flex-col flex-shrink-0">
              <span className="text-xs font-bold text-gray-500 tracking-wide whitespace-nowrap">浙江大学校园二手书系统</span>
              <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Academic Resource Hub for ZJUers</span>
            </div>
          </div>

          {/* 核心导航区 */}
          <nav className="hidden lg:flex items-center gap-2 flex-grow justify-center max-w-[500px]">
            <Link to="/" className={`nav-link px-4 py-2 text-sm font-bold ${location.pathname==='/' ? 'nav-link-active' : ''}`}>首页</Link>
            <Link to="/books" className={`nav-link px-4 py-2 text-sm font-bold ${location.pathname.startsWith('/book') ? 'nav-link-active' : ''}`}>购书</Link>
            <Link to="/schedule" className={`nav-link px-4 py-2 text-sm font-bold ${location.pathname==='/schedule' ? 'nav-link-active' : ''}`}>课表</Link>
            <Link to="/community" className={`nav-link px-4 py-2 text-sm font-bold ${location.pathname==='/community' ? 'nav-link-active' : ''}`}>笔记</Link>
            <Link to="/profile" className={`nav-link px-4 py-2 text-sm font-bold ${location.pathname==='/profile' ? 'nav-link-active' : ''}`}>中心</Link>
            {user?.role === 'admin' && (
              <Link to="/admin" className={`nav-link px-4 py-2 text-sm font-bold flex items-center gap-1 ${location.pathname==='/admin' ? 'nav-link-active text-yellow-600' : 'text-gray-600'}`}>
                <ShieldCheck className="w-4 h-4" /> 管理
              </Link>
            )}

          </nav>

          {/* 交互功能区 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="relative group hidden sm:block">
              <input 
                type="text" 
                placeholder="搜索书籍/课程..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-[220px] focus:w-[280px] h-11 bg-gray-50/50 border border-gray-100 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-zju-blue/5 focus:border-zju-blue transition-all duration-500 shadow-inner" 
              />
              <Search className="w-5 h-5 text-gray-300 absolute left-4 top-3 group-focus-within:text-zju-blue transition-colors" />
            </div>

            <Link to="/publish" className="flex items-center justify-center gap-2 bg-zju-blue text-white px-6 py-2.5 rounded-2xl font-bold shadow-xl shadow-zju-blue/10 hover:shadow-zju-blue/30 hover:-translate-y-0.5 transition-all duration-300 text-sm whitespace-nowrap">
              <PackagePlus className="w-4 h-4" /> 卖书
            </Link>

            <Link to="/messages" className="relative group p-2 text-gray-400 hover:text-zju-blue hover:bg-zju-blue/5 rounded-xl transition-all">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white ring-1 ring-red-200"></span>
            </Link>

            <div className="h-8 w-[1px] bg-gray-100 mx-1 hidden md:block"></div>

            {!isLoggedIn ? (
              <Link to="/login" className="text-sm font-bold text-gray-500 hover:text-zju-blue px-2 transition-colors">登录</Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center group relative">
                  <div className="p-0.5 rounded-full border-2 border-transparent group-hover:border-zju-blue/30 transition-all duration-500">
                    <img src="/user_avatar.png" alt="Avatar" className="w-10 h-10 rounded-full bg-white object-cover shadow-sm ring-1 ring-gray-100" />
                  </div>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="退出登录">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 业务子路由挂载出口 */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-8 relative">
        <Outlet />
      </main>

      {/* 底部 Footer */}
      <footer className="w-full bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center text-sm text-gray-400">
          <p>© 2026 求书 (ZJU Used Book) - 本科教学原型展示专用</p>
          <div className="flex gap-4">
            <span className="hover:text-zju-blue cursor-pointer">关于我们</span>
            <span className="hover:text-zju-blue cursor-pointer">服务协议</span>
            <span className="hover:text-zju-blue cursor-pointer">校园官方回收站</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
