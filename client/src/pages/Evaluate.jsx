import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp, Send } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const Evaluate = () => {
    const [rating, setRating] = useState({ desc: 5, conv: 5, atti: 5 });
    const [hover, setHover] = useState({ desc: 0, conv: 0, atti: 0 });
    const [comment, setComment] = useState('');
    const navigate = useNavigate();

    const renderStars = (type) => {
        return (
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                        key={star} 
                        className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hover[type] || rating[type]) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        onMouseEnter={() => setHover({...hover, [type]: star})}
                        onMouseLeave={() => setHover({...hover, [type]: 0})}
                        onClick={() => setRating({...rating, [type]: star})}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center">
            <h1 className="text-2xl font-extrabold text-gray-800 mb-2">感谢您使用平台进行循环交易</h1>
            <p className="text-sm text-gray-500 mb-8">请为本次与【管院小张】的面交打分，真实的评价将会影响对方的芝麻信用风控等级与积分结算。</p>
            
            <div className="flex gap-4 p-4 border border-gray-100 bg-gray-50 rounded-xl mb-10 w-full items-center">
                <img src={MOCK_BOOKS[0].cover} className="w-12 h-16 object-cover rounded shadow-sm" />
                <div>
                   <h4 className="font-bold text-gray-800 text-sm mb-1">{MOCK_BOOKS[0].title}</h4>
                   <p className="text-[10px] text-gray-400">成交价 ¥{MOCK_BOOKS[0].price} | 紫金港校区线下当面</p>
                </div>
            </div>

            <div className="w-full flex flex-col gap-6 mb-10">
                <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">书籍描述成色相符度</span>
                    {renderStars('desc')}
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">线下汇合点响应速度</span>
                    {renderStars('conv')}
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700">学长/卖方沟通态度</span>
                    {renderStars('atti')}
                </div>
            </div>

            <div className="w-full mb-8">
                <textarea 
                    rows="4" 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:outline-none focus:border-zju-blue resize-none bg-[#f8fafc]" 
                    placeholder="选填：您可以对此次淘书过程做个留言点评..."
                ></textarea>
                <div className="flex gap-2 mt-3">
                    {['学长很耐心', '成色和图片完全一致', '顺带指点了我期末题'].map(tag => (
                        <span key={tag} onClick={() => setComment(comment ? `${comment} ${tag}` : tag)} className="bg-blue-50 text-zju-blue px-3 py-1 text-xs rounded-full font-bold cursor-pointer hover:bg-blue-100 border border-blue-100">{tag}</span>
                    ))}
                </div>
            </div>

            <button onClick={() => navigate('/orders')} className="w-full bg-zju-blue text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-zju-blue/20 hover:bg-zju-hover transition-colors flex items-center justify-center gap-2">
                <Send className="w-5 h-5"/> 提交真实反馈并入账积分
            </button>
        </div>
    );
};

export default Evaluate;
