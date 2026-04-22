import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, AlertCircle, ShoppingBag, Heart, Star, Sparkles, ChevronRight, Activity, Flag } from 'lucide-react';
import { MOCK_BOOKS, MOCK_USERS } from '../mockData';

const BookDetail = () => {
  const { id } = useParams();
  const book = MOCK_BOOKS.find(b => b.id === id) || MOCK_BOOKS[0]; // fallback
  
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorited(favorites.includes(id));
  }, [id]);

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let newFavorites;
    if (isFavorited) {
      newFavorites = favorites.filter(favId => favId !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    alert(`举报提交成功！原因: ${reportReason}\n管理员将尽快核实。`);
    setShowReportModal(false);
    setReportReason('');
  };

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto relative">
      {/* 举报弹窗 */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" /> 举报违规商品
            </h2>
            <p className="text-sm text-gray-500 mb-6">请选择举报原因，维护校园社区的纯净交易环境。</p>
            <form onSubmit={handleReportSubmit}>
              <div className="space-y-3 mb-8">
                {['虚假信息/图文不符', '价格严重背离市场', '包含违规广告/外链', '卖家言行不当', '疑似盗版/侵权'].map(reason => (
                  <label key={reason} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input 
                      type="radio" 
                      name="reason" 
                      value={reason} 
                      required 
                      onChange={(e) => setReportReason(e.target.value)}
                      className="accent-zju-blue w-4 h-4" 
                    />
                    <span className="text-sm font-medium text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                >
                  提交举报
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 顶部：面包屑导航 */}
      <div className="text-sm text-gray-400 flex items-center gap-2">
        <Link to="/" className="hover:text-zju-blue">首页</Link> <ChevronRight className="w-4 h-4"/> 
        <Link to="/books" className="hover:text-zju-blue">购书大厅</Link> <ChevronRight className="w-4 h-4"/> 
        <span className="text-gray-600 font-semibold">{book.title}</span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex gap-12">
        {/* 左侧大图书图相册 */}
        <div className="w-[350px] flex-shrink-0 flex flex-col gap-4">
          <div className="w-full aspect-[3/4] bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
             <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            {[1,2,3].map(i => (
              <div key={i} className={`w-16 h-16 rounded-md overflow-hidden bg-gray-50 border-2 cursor-pointer ${i===1 ? 'border-zju-blue' : 'border-transparent'}`}>
                <img src={book.cover} className="w-full h-full object-cover opacity-80" />
              </div>
            ))}
          </div>
          <div className="bg-orange-50 text-orange-600 p-3 rounded-lg text-xs flex gap-2 items-start mt-2 border border-orange-100">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>该商品已被官方「求书防诈中心」风控扫描，卖家身份已认证为【浙江大学在校生】。线下当面交易请依然提防资金安全。</p>
          </div>
          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-red-500 mt-4 transition-colors"
          >
            <Flag className="w-3 h-3" /> 举报违规商品
          </button>
        </div>

        {/* 右侧详情与交易模块 */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">{book.title}</h1>
            <div 
              onClick={toggleFavorite}
              className={`p-2 rounded-full cursor-pointer transition-all duration-300 ${isFavorited ? 'bg-red-50 text-red-500 scale-110 shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-300'}`}
            >
              <Heart className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-6">作者: {book.author} | ISBN: 978-7-XXXX-XXXX-X | 出版社: 高等名校出版社</p>
          
          <div className="bg-[#f8fafc] p-6 rounded-xl mb-8 flex items-center justify-between border border-gray-100">
             <div className="flex flex-col gap-1">
               <span className="text-gray-400 text-xs">学长一口价</span>
               <div className="text-3xl font-extrabold text-red-500">¥{book.price} <span className="text-sm font-normal text-gray-400 line-through ml-2">原 ¥{book.originalPrice}</span></div>
             </div>
             <div className="h-10 w-px bg-gray-200"></div>
             <div className="flex flex-col gap-1 text-right">
               <span className="text-gray-400 text-xs text-left">支持交付方式</span>
               <span className="text-sm font-bold text-zju-blue">{book.campus} 面交 / 快递到寝</span>
             </div>
             <div className="h-10 w-px bg-gray-200"></div>
             <div className="flex flex-col gap-1 text-right">
               <span className="text-gray-400 text-xs text-left">书籍损耗程度</span>
               <span className="text-sm font-bold text-gray-700">{book.condition}</span>
             </div>
          </div>

          {/* AI 教材必要性动态评分系统 - （亮点模块） */}
          <div className="border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 rounded-xl p-6 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-zju-blue/5 rounded-full blur-3xl"></div>
             <div className="flex items-center gap-2 mb-4 relative z-10">
               <Sparkles className="w-5 h-5 text-zju-blue" />
               <h3 className="font-bold text-zju-blue text-lg">求书 AI 大数据：课程选书必要性深度剖析</h3>
               <Link to="/ai-analysis" className="ml-auto text-xs text-gray-400 hover:text-zju-blue">查看算法原理 &rarr;</Link>
             </div>
             <div className="flex gap-6 relative z-10">
               <div className="w-24 h-24 rounded-full border-4 border-zju-blue flex flex-col items-center justify-center bg-white shadow-sm flex-shrink-0">
                 <span className="text-2xl font-extrabold text-zju-blue">{book.aiScore}</span>
                 <span className="text-[10px] text-gray-400">综合推荐指数</span>
               </div>
               <div className="flex flex-col justify-center">
                 <div className="flex gap-2 mb-2">
                   <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">老师必点考点</span>
                   <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">历年极高重合</span>
                 </div>
                 <p className="text-sm text-gray-600 leading-relaxed font-medium">
                   "基于历任上这门课的 4,000+ 条校内真实评价计算：<br/>
                   <span className="text-gray-800 font-bold">{book.aiSummary}</span>"
                 </p>
               </div>
             </div>
          </div>

          <div className="flex items-center gap-6 mb-10 pb-6 border-b border-gray-100">
            <Link to={`/profile/${MOCK_USERS.find(u => u.name === book.seller)?.id || 'u1'}`} className="shrink-0 transition-transform hover:scale-105">
              <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`} className="w-14 h-14 rounded-full border-2 border-zju-light bg-white shadow-sm" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/profile/${MOCK_USERS.find(u => u.name === book.seller)?.id || 'u1'}`} className="font-bold text-gray-800 hover:text-zju-blue transition-colors">{book.seller}</Link>
                <span className="text-[10px] bg-yellow-100 text-yellow-600 px-1 font-bold rounded border border-yellow-200">Lv.4 资深买卖手</span>
              </div>
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-4">
                <span>历史成交: 18单</span>
                <span>好评率: 100%</span>
                <span>最后上线: 2小时前</span>
              </div>
            </div>
            <Link to={`/messages?user=${book.seller}`} className="bg-[#f8fafc] text-zju-blue border border-zju-blue/20 px-6 py-2 rounded-full font-bold text-sm hover:bg-zju-light transition-colors flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 聊一聊议价
            </Link>
          </div>

          {/* 行动呼唤区 */}
          <div className="mt-auto flex gap-4">
            <button className="flex-1 bg-gradient-to-r from-zju-blue to-[#0050ab] text-white py-4 rounded-xl font-extrabold text-lg shadow-lg shadow-zju-blue/20 hover:-translate-y-1 transition-all flex justify-center items-center gap-2">
               <ShoppingBag className="w-5 h-5" /> 立即锁单购买
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
