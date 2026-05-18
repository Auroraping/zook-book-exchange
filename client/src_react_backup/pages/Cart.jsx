import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ChevronRight, ArrowLeft, CheckCircle2, ShieldCheck, Clock } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const fullItems = savedCart.map(id => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean);
    setCartItems(fullItems);
  }, []);

  const removeFromCart = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart.map(i => i.id)));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-m3-in">
        <div className="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
           <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-normal text-gray-900 mb-4">订单已极速同步</h1>
        <p className="text-gray-500 mb-12 text-lg">系统已通知卖家，请在“消息”中查看后续交付约定。</p>
        <Link to="/books" className="m3-fab !bg-[#0b57d0] !text-white justify-center mx-auto w-fit px-12">
           继续探索
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 animate-m3-in">
      <div className="flex items-baseline gap-4 mb-12">
        <h1 className="text-5xl font-normal text-gray-900 tracking-tight">购书清单</h1>
        <span className="text-xl text-gray-400 font-normal">{cartItems.length} 个项目</span>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-12 gap-12">
          {/* 1. 商品列表 - 极致简约的列表项 */}
          <div className="col-span-8 flex flex-col gap-6">
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-[28px] p-6 flex gap-8 items-center border border-gray-100 hover:shadow-sm transition-all group">
                <div className="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm">
                   <img src={item.cover} alt={item.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-bold text-m3-blue bg-m3-blue-container px-2 py-0.5 rounded uppercase">{item.campus}</span>
                     <span className="text-[10px] font-bold text-gray-400">· {item.condition}</span>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">{item.title}</h3>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <ShieldCheck className="w-4 h-4 text-google-green" /> 担保交易
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-4 h-4" /> 预计今日交付
                     </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-8">
                  <span className="text-2xl font-normal text-gray-900">¥{item.price}</span>
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="p-3 text-gray-300 hover:text-google-red hover:bg-red-50 rounded-full transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 结算摘要 - Google Store 风格 */}
          <div className="col-span-4">
            <div className="bg-[#f0f4f8] rounded-[32px] p-10 sticky top-24">
              <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">订单摘要</h4>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-base font-medium text-gray-600">
                  <span>商品金额</span>
                  <span>¥{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-600">
                  <span>校内转运</span>
                  <span className="text-m3-blue">免运费</span>
                </div>
                <div className="flex justify-between text-base font-medium text-gray-600">
                  <span>回收补贴</span>
                  <span className="text-google-green">- ¥5.00</span>
                </div>
              </div>
              <hr className="border-gray-200 mb-10" />
              <div className="flex justify-between items-baseline mb-12">
                <span className="text-lg font-bold text-gray-800">应付总额</span>
                <span className="text-4xl font-medium text-gray-900">¥{(totalPrice - 5).toFixed(2)}</span>
              </div>
              <button 
                onClick={() => { setIsSuccess(true); localStorage.setItem('cart', '[]'); window.dispatchEvent(new Event('cartUpdated')); }}
                className="w-full m3-fab !bg-[#0b57d0] !text-white !rounded-full !py-6 justify-center text-lg shadow-xl shadow-blue-200"
              >
                确认并提交订单
              </button>
              <div className="mt-8 flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-google-green shrink-0 mt-0.5" />
                 <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                    浙里淘书保障每一笔交易。资金将暂存于平台，待您线下扫码确认收货后，款项才会拨付给卖家。
                 </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center text-center animate-m3-in">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-8">
            <ShoppingBag className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-normal text-gray-900 mb-4">您的清单目前为空</h2>
          <p className="text-gray-500 mb-12 max-w-sm text-lg">去发现更多由校友分享的优质学术资源。</p>
          <Link to="/books" className="m3-fab !bg-[#0b57d0] !text-white px-10">开始探索</Link>
        </div>
      )}
    </div>
  );
};

export default Cart;
