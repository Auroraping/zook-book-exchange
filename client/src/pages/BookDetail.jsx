import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Heart, Sparkles, ChevronRight, Share2, Info, ShoppingBag, ArrowLeft, Star } from 'lucide-react';
import { MOCK_BOOKS, MOCK_USERS } from '../mockData';

const BookDetail = () => {
  const { id } = useParams();
  const book = MOCK_BOOKS.find(b => b.id === id) || MOCK_BOOKS[0];
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorited(favorites.includes(id));
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!cart.includes(id)) {
      localStorage.setItem('cart', JSON.stringify([...cart, id]));
      window.dispatchEvent(new Event('cartUpdated'));
      alert('已添加至您的购书清单');
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-m3-in">
      
      {/* 1. M3 风格顶部条 */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/books" className="p-3 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div className="flex gap-2">
          <button className="p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-600"><Share2 className="w-5 h-5" /></button>
          <button 
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-3 hover:bg-gray-100 rounded-full transition-colors ${isFavorited ? 'text-google-red' : 'text-gray-600'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-12">
        
        {/* 2. 左侧沉浸式封面展示 */}
        <div className="col-span-5">
           <div className="rounded-[32px] overflow-hidden bg-white shadow-sm border border-gray-100 sticky top-24">
              <img src={book.cover} className="w-full aspect-[3/4] object-cover" alt={book.title} />
              <div className="p-8 bg-m3-surface-container/30 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">建议收藏指数</span>
                    <div className="flex items-center gap-1 text-google-yellow">
                       {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                 </div>
                 <div className="h-10 w-[1px] bg-gray-200"></div>
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">全校存量</span>
                    <p className="text-sm font-bold text-gray-800">仅剩 {Math.floor(Math.random()*5)+1} 本</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 3. 右侧极致简约的信息流 */}
        <div className="col-span-7 flex flex-col gap-10">
          
          <section>
            <div className="flex items-center gap-2 mb-6">
               <span className="px-3 py-1 bg-m3-blue-container text-m3-blue text-[11px] font-bold rounded-lg uppercase">{book.campus}校区</span>
               <span className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg uppercase">{book.condition}</span>
            </div>
            <h1 className="text-5xl font-normal text-gray-900 mb-4 leading-tight tracking-tight">{book.title}</h1>
            <p className="text-lg text-gray-500 font-medium mb-8">{book.author} · {book.publisher} · {book.publishYear}</p>
            
            <div className="flex items-baseline gap-4 mb-10">
              <span className="text-5xl font-medium text-gray-900">¥{book.price}</span>
              <span className="text-lg text-gray-400 line-through">原价 ¥{book.originalPrice}</span>
            </div>

            <div className="flex gap-4">
               <button onClick={addToCart} className="flex-[2] m3-fab !bg-[#0b57d0] !text-white !rounded-[24px] justify-center text-lg h-16 shadow-blue-200">
                  <ShoppingBag className="w-6 h-6" /> 加入购书清单
               </button>
               <button className="flex-1 m3-fab !bg-white border border-gray-200 !text-gray-700 !rounded-[24px] justify-center text-lg h-16">
                  <MessageSquare className="w-6 h-6" /> 聊一聊
               </button>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 4. 卖家卡片 - 采用 M3 Profile 风格 */}
          <section className="bg-white rounded-[24px] p-6 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`} alt="seller" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{book.seller}</span>
                    <ShieldCheck className="w-4 h-4 text-m3-blue" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">浙大统一身份认证 · 信用优秀</p>
               </div>
            </div>
            <Link to={`/profile`} className="text-sm font-bold text-m3-blue hover:bg-m3-blue-container px-4 py-2 rounded-full transition-colors">查看主页</Link>
          </section>

          {/* 5. AI 内容描述 - 采用 Google Search 风格的 Info 模块 */}
          <section className="bg-[#f0f4f8] rounded-[32px] p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles className="w-32 h-32 text-m3-blue" />
             </div>
             <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-6">
                   <Info className="w-5 h-5 text-m3-blue" /> 选书建议与描述
                </h3>
                <div className="flex items-start gap-6 mb-8">
                   <div className="w-16 h-16 shrink-0 rounded-2xl bg-white flex flex-col items-center justify-center border border-m3-blue/10">
                      <span className="text-[10px] font-bold text-m3-blue uppercase">评分</span>
                      <span className="text-2xl font-black text-gray-800">{book.aiScore}</span>
                   </div>
                   <p className="text-gray-600 leading-relaxed italic">“{book.aiSummary}”</p>
                </div>
                <div className="text-gray-500 text-sm leading-loose whitespace-pre-wrap">
                   {book.description || "这位校友很懒，没有留下具体的成色描述，但经过系统初步核验，书籍情况属实。建议私聊获取实拍图。"}
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default BookDetail;
