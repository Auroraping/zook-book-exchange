import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Search, MessageSquare, ShoppingCart, Bell, User, BookOpen, Plus, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from './AuthContext';
import Logo from './Logo';

const Layout = () => {
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#fbfcfd] bg-grid-pattern selection:bg-purple-100 selection:text-purple-600">
      
      {/* 极光背景装饰层 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* 1. 高级悬浮导航轨 (Sidebar) */}
      <aside className="w-28 flex flex-col items-center py-10 gap-12 sticky top-0 h-screen z-50 bg-white/80 backdrop-blur-xl border-r border-gray-100/50">
        <Link to="/" className="w-20 h-20 flex items-center justify-center hover:scale-110 transition-transform">
          <Logo showText={false} className="h-16" />
        </Link>
        
        <nav className="flex flex-col gap-8 flex-1">
          {[
            { icon: <Search className="w-6 h-6" />, path: '/books', label: '广场', color: 'blue' },
            { icon: <MessageSquare className="w-6 h-6" />, path: '/messages', label: '消息', color: 'green' },
            { icon: <ShoppingCart className="w-6 h-6" />, path: '/cart', label: '清单', count: cartCount, color: 'yellow' },
            { icon: <Bell className="w-6 h-6" />, path: '/notifications', label: '通知', color: 'red' },
            { icon: <User className="w-6 h-6" />, path: '/profile', label: '空间', color: 'purple' },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            const colors = {
                blue: 'text-blue-600 bg-blue-50',
                green: 'text-emerald-600 bg-emerald-50',
                yellow: 'text-amber-600 bg-amber-50',
                red: 'text-rose-600 bg-rose-50',
                purple: 'text-purple-600 bg-purple-50'
            };
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`group flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 ${isActive ? colors[item.color] : 'text-gray-400 hover:text-gray-800'}`}
              >
                <div className={`p-1 rounded-lg transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-tighter uppercase">{item.label}</span>
                {item.count > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full border-2 border-white font-black">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-4">
           <Link to="/publish" className="w-14 h-14 bg-gray-900 rounded-[18px] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 group">
              <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform" />
           </Link>
           {isLoggedIn && (
             <button onClick={logout} className="w-14 h-14 bg-white border border-gray-100 rounded-[18px] flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm">
               <LogOut className="w-6 h-6" />
             </button>
           )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative z-10">
        {/* 2. 极致页眉 */}
        <header className="h-24 px-16 flex items-center justify-between sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/20">
           <div className="flex-1 max-w-4xl">
              <div className="premium-search group">
                <Search className="w-6 h-6 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <input 
                  type="text" 
                  placeholder="搜索浙里淘书中的学术资源..." 
                  className="w-full bg-transparent border-none focus:ring-0 text-lg text-gray-800 placeholder-gray-400 font-medium"
                />
                <div className="hidden md:flex gap-3 items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Global Search</span>
                </div>
              </div>
           </div>
           
           <div className="flex items-center gap-8 ml-12">
              {!isLoggedIn ? (
                <Link to="/login" className="btn-premium whitespace-nowrap shadow-2xl">立即开启淘书之旅</Link>
              ) : (
                <div className="flex items-center gap-4">
                    <div className="text-right hidden xl:block">
                        <p className="text-sm font-bold text-gray-800">Hello, 求是校友</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase">Verified User</p>
                    </div>
                    <Link to="/profile" className="w-14 h-14 rounded-[20px] border-4 border-white shadow-2xl overflow-hidden hover:scale-110 transition-all rotate-3">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full object-cover" />
                    </Link>
                </div>
              )}
           </div>
        </header>

        {/* 3. 内容区 */}
        <main className="px-16 py-12">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
