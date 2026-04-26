import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, BookOpen, MessageSquare, User, Bell, PackagePlus, LogOut, ShieldCheck, ShoppingCart, Plus, Menu } from 'lucide-react';
import { useAuth } from './AuthContext';
import { MOCK_NOTIFICATIONS } from '../mockData';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isLoggedIn, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };
    updateCartCount();
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const isLoginPage = location.pathname === '/login';
  if (isLoginPage) return <div className="min-h-screen bg-[#F8F9FA]"><Outlet /></div>;

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] selection:bg-google-blue selection:text-white">
      
      {/* 1. Google 标志性的侧边导航栏 (Navigation Rail/Drawer) */}
      <aside className="w-24 flex flex-col items-center py-8 gap-10 bg-white border-r border-gray-100 sticky top-0 h-screen z-50">
        <Link to="/" className="w-12 h-12 bg-google-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-google-blue/20 hover:scale-110 transition-transform">
          <BookOpen className="w-7 h-7" />
        </Link>
        
        <nav className="flex flex-col gap-6 flex-1">
          {[
            { icon: <Search className="w-6 h-6" />, path: '/books', label: '搜索' },
            { icon: <MessageSquare className="w-6 h-6" />, path: '/messages', label: '消息' },
            { icon: <ShoppingCart className="w-6 h-6" />, path: '/cart', label: '购物车', count: cartCount },
            { icon: <Bell className="w-6 h-6" />, path: '/notifications', label: '通知' },
            { icon: <User className="w-6 h-6" />, path: '/profile', label: '我的' },
          ].map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`relative group p-4 rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-google-light-blue text-google-blue' : 'text-gray-400 hover:bg-gray-50 hover:text-google-blue'}`}
            >
              {item.icon}
              {item.count > 0 && (
                <span className="absolute top-3 right-3 w-4 h-4 bg-google-red text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white">
                  {item.count}
                </span>
              )}
              <span className="absolute left-20 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all pointer-events-none whitespace-nowrap z-[100]">
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-6">
           <Link to="/publish" className="w-12 h-12 bg-google-surface border border-gray-100 rounded-2xl flex items-center justify-center text-google-blue hover:bg-google-light-blue transition-colors">
              <Plus className="w-6 h-6" />
           </Link>
           {isLoggedIn && (
             <button onClick={handleLogout} className="p-4 text-gray-400 hover:text-google-red transition-colors">
               <LogOut className="w-6 h-6" />
             </button>
           )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* 2. 标志性的顶部搜索/用户区 */}
        <header className="h-[88px] px-12 flex items-center justify-between sticky top-0 bg-[#F8F9FA]/80 backdrop-blur-xl z-40">
           <div className="flex-1 max-w-3xl">
              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-google-blue transition-colors" />
                <input 
                  type="text" 
                  placeholder="搜索书籍、资料、校友..." 
                  className="w-full h-14 bg-white border-none rounded-[28px] pl-16 pr-6 text-gray-600 shadow-sm focus:shadow-google-hover focus:outline-none transition-all duration-300"
                />
              </div>
           </div>
           
           <div className="flex items-center gap-6 ml-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                 <div className="w-2 h-2 bg-google-green rounded-full animate-pulse"></div>
                 <span className="text-xs font-medium text-gray-500">玉泉校区 · 正常运行</span>
              </div>
              {!isLoggedIn ? (
                <Link to="/login" className="m3-btn-filled !px-6 !py-2.5 !text-sm">登录</Link>
              ) : (
                <Link to="/profile" className="w-11 h-11 rounded-full border-2 border-white shadow-md overflow-hidden hover:scale-105 transition-transform">
                  <img src="/user_avatar.png" className="w-full h-full object-cover" />
                </Link>
              )}
           </div>
        </header>

        {/* 3. 主内容区 - 采用典型的 Google 留白布局 */}
        <main className="px-12 pb-20">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default Layout;
