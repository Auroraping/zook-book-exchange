import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, MessageSquare, Heart, Sparkles, Share2, Info, ShoppingBag, ArrowLeft, Star } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

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
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-google-in pt-6">
      
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-10">
        <Link to="/books" className="p-3 hover:bg-gray-100 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6 text-google-gray" />
        </Link>
        <div className="flex gap-2">
          <button className="p-3 hover:bg-gray-100 rounded-full transition-all text-google-gray"><Share2 className="w-5 h-5" /></button>
          <button 
            onClick={() => setIsFavorited(!isFavorited)}
            className={`p-3 hover:bg-gray-100 rounded-full transition-all ${isFavorited ? 'text-google-red' : 'text-google-gray'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
        
        {/* 左侧封面 */}
        <div className="md:col-span-5">
           <div className="google-card overflow-hidden !rounded-[32px] sticky top-24">
              <img src={book.cover} className="w-full aspect-[4/5] object-cover" alt={book.title} />
              <div className="p-8 bg-gray-50 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-google-gray uppercase tracking-widest mb-1">推荐指数</span>
                    <div className="flex items-center gap-0.5 text-google-yellow">
                       {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                    </div>
                 </div>
                 <div className="h-10 w-[1px] bg-gray-200"></div>
                 <div className="text-right">
                    <span className="text-[10px] font-bold text-google-gray uppercase tracking-widest mb-1">库存状态</span>
                    <p className="text-sm font-medium text-google-on-surface">仅剩 {Math.floor(Math.random()*5)+1} 本</p>
                 </div>
              </div>
           </div>
        </div>

        {/* 右侧信息 */}
        <div className="md:col-span-7 flex flex-col gap-12">
          
          <section>
            <div className="flex items-center gap-2 mb-8">
               <span className="google-chip-active px-3 py-1 text-[10px] font-bold rounded-lg uppercase">{book.campus}校区</span>
               <span className="bg-google-green/10 text-google-green px-3 py-1 text-[10px] font-bold rounded-lg uppercase border border-google-green/10">{book.condition}</span>
            </div>
            <h1 className="text-5xl font-medium text-google-on-surface mb-6 leading-tight tracking-tight">{book.title}</h1>
            <p className="text-xl text-google-gray mb-10">{book.author} · {book.publisher} · {book.publishYear}</p>
            
            <div className="flex items-baseline gap-6 mb-12">
              <span className="text-6xl font-medium text-google-on-surface">¥{book.price}</span>
              <span className="text-xl text-google-gray line-through">原价 ¥{book.originalPrice}</span>
            </div>

            <div className="flex gap-4">
               <button onClick={addToCart} className="flex-[2] m3-btn-filled !rounded-[24px] !py-5 flex items-center justify-center gap-3 text-lg shadow-google-3">
                  <ShoppingBag className="w-6 h-6" /> 加入购书清单
               </button>
               <button className="flex-1 m3-btn-tonal !bg-white border border-gray-200 !text-google-on-surface !rounded-[24px] flex items-center justify-center gap-3 text-lg hover:bg-gray-50">
                  <MessageSquare className="w-6 h-6" /> 聊一聊
               </button>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 卖家信息 */}
          <section className="google-card p-6 flex items-center justify-between !rounded-[24px] !shadow-none !border-gray-100">
            <div className="flex items-center gap-5">
               <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-100">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${book.seller}`} alt="seller" />
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-google-on-surface">{book.seller}</span>
                    <ShieldCheck className="w-4 h-4 text-google-blue" />
                  </div>
                  <p className="text-xs text-google-gray mt-1 font-medium">浙大统一身份认证 · 信用优秀</p>
               </div>
            </div>
            <Link to={`/profile`} className="m3-btn-tonal !px-5 !py-2 !text-xs">查看主页</Link>
          </section>

          {/* AI 选书建议 */}
          <section className="bg-m3-primary-container/30 rounded-[32px] p-10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                <Sparkles className="w-40 h-40 text-google-blue" />
             </div>
             <div className="relative z-10">
                <h3 className="flex items-center gap-2 text-xl font-medium text-google-on-surface mb-8">
                   <Info className="w-5 h-5 text-google-blue" /> AI 选书建议
                </h3>
                <div className="flex items-start gap-8 mb-10">
                   <div className="w-16 h-16 shrink-0 rounded-2xl bg-white flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[10px] font-bold text-google-gray uppercase mb-0.5">评分</span>
                      <span className="text-2xl font-bold text-google-blue">{book.aiScore}</span>
                   </div>
                   <p className="text-lg text-google-gray leading-relaxed italic">“{book.aiSummary}”</p>
                </div>
                <div className="text-google-gray text-sm leading-loose whitespace-pre-wrap px-1">
                   {book.description || "这位校友很详细地描述了书籍情况。经过系统核验，书籍情况属实。建议私聊获取更多细节。"}
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default BookDetail;
