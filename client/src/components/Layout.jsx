import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Bell, BookOpen, Plus, LogOut, ArrowRight, CalendarDays, Heart } from 'lucide-react';
import { useAuth } from './AuthContext';
import Logo from './Logo';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState(() => new URLSearchParams(location.search).get('q') || '');

  useEffect(() => {
    const updateCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.length);
    };
    updateCart();
    window.addEventListener('cartUpdated', updateCart);
    return () => window.removeEventListener('cartUpdated', updateCart);
  }, []);

  useEffect(() => {
    setSearchTerm(new URLSearchParams(location.search).get('q') || '');
  }, [location.pathname, location.search]);

  const submitSearch = (event) => {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/books?q=${encodeURIComponent(query)}` : '/books');
  };

  return (
    <div className="min-h-screen flex bg-[#fbfcfd] bg-grid-pattern selection:bg-purple-100 selection:text-purple-600">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-100/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <aside className="w-24 flex flex-col items-center py-6 sticky top-0 h-screen z-50 bg-white/80 backdrop-blur-xl border-r border-gray-100/50">
        <Link to="/" className="w-16 h-16 flex items-center justify-center hover:scale-110 transition-transform mb-8">
          <Logo showText={false} className="h-12" />
        </Link>

        <nav className="flex flex-col gap-4 flex-1">
          {[
            { icon: <Search className="w-6 h-6" />, path: '/books', label: '广场', color: 'blue' },
            { icon: <Heart className="w-6 h-6" />, path: '/wish-square', label: '心愿', color: 'purple' },
            { icon: <ShoppingCart className="w-6 h-6" />, path: '/cart', label: '清单', count: cartCount, color: 'yellow' },
            { icon: <CalendarDays className="w-6 h-6" />, path: '/schedule', label: '课表', color: 'green' },
            { icon: <BookOpen className="w-6 h-6" />, path: '/community', label: '社区', color: 'blue' },
            { icon: <Bell className="w-6 h-6" />, path: '/chat', label: '消息', color: 'blue' },
            { icon: <img src="/taosu.png" alt="桃酥" className="w-8 h-8 object-contain" />, path: '/ai-analysis', label: '桃酥', color: 'orange' },
          ].map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            const colors = {
              blue: 'text-blue-600 bg-blue-50',
              purple: 'text-purple-600 bg-purple-50',
              yellow: 'text-amber-600 bg-amber-50',
              green: 'text-emerald-600 bg-emerald-50',
              orange: 'text-orange-600 bg-orange-50',
            };
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative group flex flex-col items-center gap-1 p-2.5 rounded-2xl transition-all duration-300 ${isActive ? colors[item.color] : 'text-gray-400 hover:text-gray-800'}`}
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

        <div className="flex flex-col gap-3 mt-auto">
          <Link to="/publish" className="w-12 h-12 bg-gray-900 rounded-[16px] flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-transform active:scale-95 group">
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" />
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col relative z-10">
        <header className="h-24 px-16 flex items-center justify-between sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/20">
          <div className="flex-1 max-w-3xl">
            <form onSubmit={submitSearch} className="group h-16 bg-white/85 border border-gray-100 rounded-[24px] px-5 flex items-center gap-4 shadow-[0_12px_40px_rgba(60,64,67,0.08)] backdrop-blur-xl focus-within:bg-white focus-within:border-blue-100 focus-within:shadow-[0_16px_48px_rgba(26,115,232,0.12)] transition-all">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-focus-within:bg-blue-600 group-focus-within:text-white transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索书名、作者、ISBN 或课程关键词"
                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-base text-gray-800 placeholder-gray-400 font-medium"
              />
              <div className="flex items-center gap-3 pl-3 border-l border-gray-100">
                <span className="hidden lg:inline text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Global Search</span>
                <button type="submit" className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all" title="搜索">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-8 ml-12">
            {!isLoggedIn ? (
              <Link to="/login" className="btn-premium whitespace-nowrap shadow-2xl">立即开启淘书之旅</Link>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/chat"
                  className={`relative w-12 h-12 rounded-[16px] border flex items-center justify-center transition-all shadow-sm ${
                    location.pathname === '/chat'
                      ? 'bg-blue-50 text-blue-600 border-blue-100'
                      : 'bg-white text-gray-400 border-gray-100 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title="消息通知"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
                </Link>
                <div className="text-right hidden xl:block">
                  <p className="text-sm font-bold text-gray-800">Hello, 求是校友</p>
                  <p className="text-[10px] text-emerald-500 font-black uppercase">Verified User</p>
                </div>
                <Link to="/profile" className="w-14 h-14 rounded-[20px] border-4 border-white shadow-2xl overflow-hidden hover:scale-110 transition-all rotate-3">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-full h-full object-cover" />
                </Link>
                <button onClick={logout} className="w-12 h-12 bg-white border border-gray-100 rounded-[16px] flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-colors shadow-sm" title="退出登录">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

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
