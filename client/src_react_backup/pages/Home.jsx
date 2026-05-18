import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, FileText, Zap, ArrowRight, ChevronRight, Bookmark, Sparkles } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';
import { useAuth } from '../components/AuthContext';

const Home = () => {
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="flex flex-col gap-24 animate-google-in">
      
      {/* 极致震撼 Hero 区域 */}
      <section className="relative py-20">
        <div className="flex flex-col items-center text-center relative z-10">
          
          <h1 className="text-8xl font-black mb-10 tracking-tight leading-tight">
            <span className="premium-gradient-text">好书淘不尽</span><br/>
            <span className="premium-gradient-text uppercase">浙里top three</span>
          </h1>
          
          <p className="text-2xl text-gray-500 mb-16 max-w-3xl leading-relaxed font-medium">
            告别昂贵的新书，拥抱传承的智慧。<br/>
            在“浙里淘书”，每一本教材都是学长留给你的通关秘籍。
          </p>
          
          <div className="flex items-center gap-6">
            <Link to="/books" className="btn-premium !px-12 !py-6 text-xl flex items-center gap-3">
              立即探索广场 <ArrowRight className="w-6 h-6" />
            </Link>
            <Link to="/publish" className="px-10 py-5 rounded-full border-2 border-gray-900 font-bold text-gray-900 hover:bg-gray-900 hover:text-white transition-all text-xl">
              我要出书
            </Link>
          </div>

          {/* IP形象：桃酥 Taosu */}
          <Link to="/ai-analysis" className="mt-20 flex flex-col items-center animate-bounce-slow group/taosu">
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-400 blur-2xl opacity-20 group-hover/taosu:opacity-40 transition-opacity rounded-full"></div>
              <img 
                src="/taosu.png" 
                alt="桃酥 Taosu" 
                className="w-48 h-48 object-contain relative z-10 mix-blend-multiply group-hover/taosu:scale-105 transition-transform"
              />
              <div className="absolute -top-4 -right-20 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-float">
                <p className="text-xs font-bold text-gray-800 whitespace-nowrap">嗨！我是桃酥~ <br/><span className="text-orange-500">点我进入 AI 助手</span></p>
                <div className="absolute bottom-[-6px] left-4 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45"></div>
              </div>
            </div>
          </Link>
        </div>

        {/* 装饰性漂浮元素 */}
        <div className="absolute top-20 right-[15%] w-32 h-32 bg-blue-100 rounded-[30px] rotate-12 blur-sm -z-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-[15%] w-24 h-24 bg-rose-100 rounded-[20px] -rotate-12 blur-sm -z-10 animate-float"></div>
      </section>

      {/* 核心功能 */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { icon: <ShoppingCart className="w-10 h-10" />, title: "购书广场", desc: "智能课程匹配，精准锁定下期教材", color: "from-blue-500 to-indigo-600", path: "/books" },
          { icon: <Upload className="w-10 h-10" />, title: "极速发布", desc: "拍照即识别，3秒上架您的闲置", color: "from-emerald-500 to-teal-600", path: "/publish" },
          { icon: <FileText className="w-10 h-10" />, title: "笔记社区", desc: "学霸笔记加持，高分从未如此简单", color: "from-orange-500 to-rose-600", path: "/community" },
          { icon: <Zap className="w-10 h-10" />, title: "AI 分析", desc: "桃酥 AI 助你分析价格趋势，买卖不亏", color: "from-purple-500 to-violet-600", path: "/ai-analysis" }
        ].map((item, idx) => (
          <Link key={idx} to={item.path} className="premium-card p-10 group relative overflow-hidden block transition-all hover:scale-[1.02] active:scale-95">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-[100px]`}></div>
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-8 shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
              {item.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed font-medium">{item.desc}</p>
          </Link>
        ))}
      </section>

      {/* 正在热卖 */}
      <section className="py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-[2px] bg-blue-600"></div>
                <span className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Trending Now</span>
            </div>
            <h2 className="text-6xl font-black text-gray-900 leading-none">正在热卖</h2>
          </div>
          <Link to="/books" className="px-8 py-4 bg-gray-100 rounded-2xl font-bold text-gray-800 flex items-center gap-2 hover:bg-gray-200 transition-all">
            查看全部广场 <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {MOCK_BOOKS.slice(0, 4).map(book => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <div className="premium-card !p-0 overflow-hidden !rounded-[40px]">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                     <span className="px-3 py-1 bg-white/90 backdrop-blur text-[10px] font-black text-gray-900 rounded-full shadow-sm">{book.condition}</span>
                     {book.aiScore > 90 && <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full shadow-lg">PREMIUM</span>}
                  </div>
                  <button className="absolute top-6 right-6 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-blue-600 transition-colors">{book.title}</h3>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`} alt="seller" />
                    </div>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{book.campus}校区</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Price</p>
                        <span className="text-3xl font-black text-gray-900 tracking-tight">¥{book.price}</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gray-900 text-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
                        <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isLoggedIn && (
        <section className="mb-20">
          <div className="bg-gray-900 rounded-[60px] p-24 text-center relative overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.2)]">
            <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-blue-600 opacity-20 blur-[150px] rotate-45"></div>
            <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-purple-600 opacity-20 blur-[150px] -rotate-45"></div>
            
            <div className="relative z-10">
              <h2 className="text-7xl font-black text-white mb-8 leading-none tracking-tight">加入求是园的<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">知识文艺复兴</span></h2>
              <p className="text-gray-400 mb-16 max-w-2xl mx-auto text-xl font-medium">
                在这里，每一页翻过的纸张都有温度。已有数万名同学通过“浙里淘书”找到了他们的学术引路人。好书淘不尽，浙里top three。
              </p>
              <Link to="/login" className="px-16 py-6 bg-white text-gray-900 rounded-full font-black text-2xl hover:scale-110 transition-transform shadow-2xl inline-block">
                立即开启寻书之旅
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default Home;
