import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, FileText, Gift, Sparkles, TrendingUp, Cpu } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const Home = () => {
  return (
    <div className="flex flex-col gap-10">
      
      {/* 顶部主横幅与官方展位 */}
      <section className="grid grid-cols-12 gap-8 h-[360px]">
        {/* 左侧巨大的英雄横幅 */}
        <div className="col-span-8 bg-gradient-to-br from-[#003F88] to-[#0050ab] rounded-2xl relative overflow-hidden shadow-xl shadow-zju-blue/10 flex flex-col justify-center px-12 text-white">
          <div className="absolute right-[-100px] top-[-50px] opacity-10">
            <Sparkles className="w-[400px] h-[400px]" />
          </div>
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-4 font-serif tracking-wide text-white">让旧知焕发新生</h1>
            <p className="text-lg text-blue-100 mb-8 max-w-lg leading-relaxed">
              学期末不再为成堆的教科书发愁，新学期一键购买全套课表必修书。<br/>专为浙大学子打造的课表智能驱动二手交易网络。
            </p>
            <div className="flex gap-4">
              <Link to="/books" className="bg-white text-zju-blue px-8 py-3 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all text-sm">去市场淘书</Link>
              <Link to="/publish" className="bg-zju-blue border-2 border-white/30 text-white px-8 py-3 rounded-full font-bold hover:bg-white/10 transition-all text-sm">发布我的闲置</Link>
            </div>
          </div>
        </div>

        {/* 右侧快捷活动墙 */}
        <div className="col-span-4 flex flex-col gap-4">
          <div className="flex-1 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between hover:border-zju-blue/40 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-lg">🎓 期末官方兜底回收计划</h3>
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded-md">HOT</span>
              </div>
              <p className="text-sm text-gray-500">免预约，宿管阿姨代收，按书重直接折现到校园卡！</p>
            </div>
            <Link to="/achievements" className="text-sm font-bold text-zju-blue flex items-center hover:underline">查看我的回收额度 &rarr;</Link>
          </div>
          <div className="flex-1 bg-zju-light rounded-2xl p-6 border border-blue-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
             <div>
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="text-zju-blue w-5 h-5"/>
                <h3 className="font-bold text-zju-blue text-lg">AI 选书智囊</h3>
              </div>
              <p className="text-sm text-zju-hover">不知道这课要不要买教材？让历届学长留下的十万条弹幕帮你做决策。</p>
            </div>
            <Link to="/ai-analysis" className="text-sm font-bold text-zju-hover flex items-center hover:underline">体验超能力 &rarr;</Link>
          </div>
        </div>
      </section>

      {/* 快捷金刚区入口 */}
      <section className="grid grid-cols-4 gap-6">
        {[
          { icon: <ShoppingCart />, title: "淘教材辅导", desc: "快速按专业筛选", link: "/books", color: "bg-blue-50 text-blue-600" },
          { icon: <Upload />, title: "传闲置回血", desc: "扫底码极速录入", link: "/publish", color: "bg-emerald-50 text-emerald-600" },
          { icon: <FileText />, title: "绑定我的课表", desc: "自动匹配下学期用书", link: "/schedule", color: "bg-purple-50 text-purple-600" },
          { icon: <Gift />, title: "高分笔记社区", desc: "历届学霸的手写资料", link: "/community", color: "bg-orange-50 text-orange-600" }
        ].map((item, idx) => (
          <Link to={item.link} key={idx} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all flex items-center gap-4">
            <div className={`p-4 rounded-xl ${item.color}`}>
              {item.icon}
            </div>
            <div>
              <h4 className="font-bold text-gray-800">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {/* 本周热门推荐 */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-zju-blue" />
            <h2 className="text-2xl font-bold text-gray-800">平台捡漏热榜</h2>
          </div>
          <Link to="/books" className="text-sm text-gray-500 hover:text-zju-blue font-medium">查看所有好书 &rarr;</Link>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {MOCK_BOOKS.slice(0, 8).map(book => (
            <Link to={`/book/${book.id}`} key={book.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
              <div className="relative h-[240px] overflow-hidden">
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {book.aiScore > 90 && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">
                    AI 强推必买
                  </div>
                )}
                {book.hasNotes && (
                   <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-zju-blue border border-zju-blue/20 text-[10px] font-bold px-2 py-1 rounded shadow-md">
                   带学霸笔记
                 </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1 truncate">{book.title}</h3>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{book.campus}</span>
                  <span className="text-xs text-gray-500">{book.condition}</span>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-xl font-extrabold text-red-500">¥{book.price}</span>
                    <span className="text-xs text-gray-400 line-through ml-2">原 ¥{book.originalPrice}</span>
                  </div>
                  <span className="text-xs font-semibold text-zju-blue bg-zju-light px-2 py-1 rounded">详情 &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
