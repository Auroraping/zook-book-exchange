import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, FileText, Gift, ArrowRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';
import { useAuth } from '../components/AuthContext';

const Home = () => {
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen bg-mesh">
      
      {/* 极简 M3 Hero 区域 - 注入灵魂的设计 */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-google-blue/5 text-google-blue text-xs font-bold mb-8 animate-fade-in">
            <Zap className="w-3 h-3 fill-current" />
            <span>浙江大学专属学术流转平台</span>
          </div>
          
          <h1 className="text-7xl font-normal text-[#202124] mb-8 tracking-tight leading-[1.1]">
            让知识在校园里<br/>
            <span className="m3-gradient-text font-medium">自由流转</span>
          </h1>
          
          <p className="text-xl text-gray-500 mb-12 max-w-2xl leading-relaxed">
            不再让珍贵的教材在书架蒙尘。通过“求是书缘”，<br/>
            让每一本旧书在新的学期找到它的下一个主人。
          </p>
          
          <div className="flex items-center gap-6">
            <Link to="/books" className="m3-btn-filled flex items-center gap-2">
              立即探索购书 <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/publish" className="m3-btn-tonal">
              发布我的闲置
            </Link>
          </div>
        </div>

        {/* 装饰性背景元素 - 模拟 Google 设计稿 */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-google-blue/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-google-red/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </section>

      {/* 核心功能区 - 高级卡片网格 */}
      <section className="max-w-7xl mx-auto px-6 -mt-16 relative z-20 w-full mb-32">
        <div className="grid grid-cols-4 gap-8">
          {[
            { icon: <ShoppingCart className="w-6 h-6" />, title: "购书广场", desc: "按专业、课程极速筛选", link: "/books", color: "text-google-blue", bg: "bg-blue-50/50" },
            { icon: <Upload className="w-6 h-6" />, title: "发布闲置", desc: "一键拍照，智能估价", link: "/publish", color: "text-google-green", bg: "bg-green-50/50" },
            { icon: <FileText className="w-6 h-6" />, title: "课表同步", desc: "自动匹配下学期教材", link: "/schedule", color: "text-google-yellow", bg: "bg-yellow-50/50" },
            { icon: <Gift className="w-6 h-6" />, title: "笔记社区", desc: "学霸笔记，高分指南", link: "/community", color: "text-google-red", bg: "bg-red-50/50" }
          ].map((item, idx) => (
            <Link to={item.link} key={idx} className="m3-card group">
              <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门推荐 - 瀑布流/平滑滚动感 */}
      <section className="max-w-7xl mx-auto px-6 w-full mb-32">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl font-medium text-gray-900 mb-2">正在热卖</h2>
            <p className="text-gray-400">来自 34,210 位浙大校友的真实分享</p>
          </div>
          <Link to="/books" className="text-google-blue font-medium hover:underline flex items-center gap-1">
            查看全部广场 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-8">
          {MOCK_BOOKS.filter(b => b.status === 'approved').slice(0, 8).map(book => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <div className="m3-card !p-0 overflow-hidden border-none shadow-none group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] transition-all duration-500">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  {book.aiScore > 90 && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur text-google-red text-[10px] font-bold rounded-full shadow-sm">
                      AI 强力推荐
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-1 truncate">{book.title}</h3>
                  <p className="text-xs text-gray-400 mb-4">{book.campus}校区 · {book.condition}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-normal text-[#202124]">¥{book.price}</span>
                    <div className="w-8 h-8 rounded-full bg-google-blue/5 text-google-blue flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 底部号召 - 现代极简风格 */}
      {!isLoggedIn && (
        <section className="px-6 pb-32">
          <div className="max-w-7xl mx-auto bg-[#202124] rounded-[48px] p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-google-blue/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
            <div className="relative z-10">
              <h2 className="text-5xl font-normal text-white mb-6">加入求是园的知识网络</h2>
              <p className="text-gray-400 mb-12 max-w-md mx-auto text-lg">
                数万名师生已经在这里开始了他们的学术分享之旅。
              </p>
              <Link to="/login" className="m3-btn-filled !bg-white !text-black !px-12 hover:shadow-[0_8px_24px_rgba(255,255,255,0.2)]">
                立即极速登录
              </Link>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

const ChevronRight = ({className}) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
);

export default Home;
