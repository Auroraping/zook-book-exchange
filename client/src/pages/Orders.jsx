import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const Orders = () => {
    const navigate = useNavigate();
    const tabs = ['全部状态', '待对方确认', '玉泉当面交付中', '待收货', '待评价'];
    const [activeTab, setActiveTab] = useState('全部状态');

    return (
        <div className="max-w-[1000px] mx-auto flex flex-col gap-6">
            <h1 className="text-2xl font-extrabold text-gray-800 mb-2">我的履约订单</h1>
            
            <div className="flex gap-4 border-b border-gray-200 pb-px">
                {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'text-zju-blue border-zju-blue' : 'text-gray-400 border-transparent hover:text-gray-600'}`}>
                        {tab} {tab === '玉泉当面交付中' && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">1</span>}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-6 mt-4">
                {/* 活跃的进行中订单演示 */}
                <div className="bg-white rounded-2xl border border-zju-blue/20 shadow-md shadow-zju-blue/5 overflow-hidden">
                    <div className="bg-zju-light/50 px-6 py-4 flex justify-between items-center border-b border-zju-blue/10">
                        <div className="flex items-center gap-4 text-xs">
                            <span className="font-bold text-gray-800">2026-04-19 19:30</span>
                            <span className="text-gray-400">订单号: ZJU-TRD-491023</span>
                        </div>
                        <div className="text-sm font-extrabold text-zju-blue flex items-center gap-1"><MapPin className="w-4 h-4"/> 等待线下约定面交</div>
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 flex gap-6">
                            <img src={MOCK_BOOKS[1].cover} className="w-20 h-28 object-cover rounded-lg border border-gray-100 shadow-sm" />
                            <div className="flex flex-col justify-center">
                                <h3 className="font-bold text-gray-800 text-lg mb-2">{MOCK_BOOKS[1].title}</h3>
                                <div className="text-sm text-gray-500 mb-1">卖家: <span className="font-semibold text-gray-700">{MOCK_BOOKS[1].seller}</span></div>
                                <div className="text-sm text-gray-500">面交地址: <span className="font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">西溪校区 北门罗森便利店</span></div>
                            </div>
                        </div>
                        
                        <div className="w-px h-20 bg-gray-100 mx-4 hidden md:block"></div>
                        
                        <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <div className="text-2xl font-black text-red-500">¥ {MOCK_BOOKS[1].price}</div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => navigate('/messages')}
                                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    联系卖家
                                </button>
                                <button 
                                    onClick={() => alert('确认收货成功！')}
                                    className="bg-zju-blue text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-zju-blue/20 hover:bg-zju-hover transition-colors flex gap-1 items-center"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> 确认已当面收货
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 已经完成等待评价的历史订单展示 */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                        <div className="flex items-center gap-4 text-xs">
                            <span className="font-bold text-gray-800">2026-03-01 10:15</span>
                            <span className="text-gray-400">订单号: ZJU-TRD-183922</span>
                        </div>
                        <div className="text-sm font-bold text-green-600 flex items-center gap-1">交易圆满完成</div>
                    </div>
                    
                    <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
                        <div className="flex-1 flex gap-6">
                            <img src={MOCK_BOOKS[0].cover} className="w-16 h-24 object-cover rounded-lg border border-gray-100 grayscale-[20%]" />
                            <div className="flex flex-col justify-center">
                                <h3 className="font-bold text-gray-800 mb-2">{MOCK_BOOKS[0].title}</h3>
                                <div className="text-xs text-gray-500">交易方式: 紫金港菜鸟驿站极速达</div>
                            </div>
                        </div>
                        
                        <div className="w-px h-16 bg-gray-100 mx-4 hidden md:block"></div>
                        
                        <div className="flex flex-col items-end gap-3 min-w-[200px]">
                            <div className="text-xl font-bold text-gray-800">¥ {MOCK_BOOKS[0].price}</div>
                            <button 
                                onClick={() => navigate('/evaluate/0')}
                                className="bg-white border border-zju-blue text-zju-blue px-4 py-1.5 rounded-lg font-bold text-xs hover:bg-zju-light transition-colors shadow-sm"
                            >
                                评价并获取积分
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Orders;
