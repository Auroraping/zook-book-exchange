import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageSquare, User, Bell, PackagePlus } from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/books?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  // 模拟判断是否处在登录页，若是则全屏隐藏 Layout Nav（根据业务逻辑，登录页不需要顶部导航栏）
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <div className="min-h-screen bg-gray-50"><Outlet /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8fc]">
      {/* 浙大蓝主题顶部导航栏 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-[72px] flex items-center justify-between">
          
          {/* Logo 区 */}
          <Link to="/" className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-zju-blue" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-zju-blue tracking-wider font-serif">求书</span>
              <span className="text-[10px] text-gray-400 tracking-widest mt-[-2px]">ZJU USED BOOK PLATFORM</span>
            </div>
            <div className="h-6 w-[1px] bg-gray-200 mx-4"></div>
            <span className="text-sm font-semibold text-gray-500 tracking-wider">浙江大学校园二手书与教学资源平台</span>
          </Link>

          {/* 导航链路 */}
          <nav className="hidden md:flex items-center gap-8 px-8 flex-shrink-0">
            <Link to="/" className={`font-semibold hover:text-zju-blue transition-colors px-2 py-4 whitespace-nowrap ${location.pathname==='/' ? 'text-zju-blue border-b-2 border-zju-blue' : 'text-gray-600'}`}>首页大盘</Link>
            <Link to="/books" className={`font-semibold hover:text-zju-blue transition-colors px-2 py-4 whitespace-nowrap ${location.pathname.startsWith('/book') ? 'text-zju-blue border-b-2 border-zju-blue' : 'text-gray-600'}`}>购书大厅</Link>
            <Link to="/schedule" className={`font-semibold hover:text-zju-blue transition-colors px-2 py-4 whitespace-nowrap ${location.pathname==='/schedule' ? 'text-zju-blue border-b-2 border-zju-blue' : 'text-gray-600'}`}>课表指引</Link>
            <Link to="/community" className={`font-semibold hover:text-zju-blue transition-colors px-2 py-4 whitespace-nowrap ${location.pathname==='/community' ? 'text-zju-blue border-b-2 border-zju-blue' : 'text-gray-600'}`}>共享笔记</Link>
            <Link to="/profile" className={`font-semibold hover:text-zju-blue transition-colors px-2 py-4 whitespace-nowrap ${location.pathname==='/profile' ? 'text-zju-blue border-b-2 border-zju-blue' : 'text-gray-600'}`}>个人中心</Link>
          </nav>

          {/* 全局交互区 */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="搜索教材 / 课程名 / ISBN号" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="w-[300px] h-10 bg-gray-50 border border-gray-200 rounded-full pl-10 pr-4 text-sm focus:outline-none focus:border-zju-blue focus:ring-1 focus:ring-zju-blue transition-all" 
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-3 group-focus-within:text-zju-blue transition-colors" />
            </div>

            <Link to="/publish" className="flex items-center justify-center gap-2 bg-gradient-to-r from-zju-blue to-[#0050ab] text-white px-5 py-2 rounded-full font-semibold shadow-md shadow-zju-blue/20 hover:-translate-y-0.5 transition-transform text-sm whitespace-nowrap flex-shrink-0">
              <PackagePlus className="w-4 h-4" /> 发闲置
            </Link>

            <Link to="/messages" className="relative text-gray-500 hover:text-zju-blue transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </Link>

            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-zju-blue transition-colors whitespace-nowrap">
              登录 / 注册
            </Link>

            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/avatar_user_1776602211333.png" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-zju-light shadow-sm bg-white object-cover" />
            </Link>
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
