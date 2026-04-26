import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, User, MapPin, AlertCircle, CheckCircle2, Clock, XCircle, CreditCard, Star } from 'lucide-react';
import { MOCK_ORDERS } from '../mockData';

const Orders = () => {
    const navigate = useNavigate();
    const tabs = [
      { id: 'all', label: '全部订单' },
      { id: 'unpaid', label: '待支付', icon: <Clock className="w-4 h-4" /> },
      { id: 'pending', label: '待收货', icon: <MapPin className="w-4 h-4" /> },
      { id: 'completed', label: '已完成', icon: <CheckCircle2 className="w-4 h-4" /> },
      { id: 'cancelled', label: '已取消', icon: <XCircle className="w-4 h-4" /> }
    ];
    const [activeTab, setActiveTab] = useState('all');

    const filteredOrders = useMemo(() => {
      if (activeTab === 'all') return MOCK_ORDERS;
      return MOCK_ORDERS.filter(o => o.status === activeTab);
    }, [activeTab]);

    const getStatusInfo = (status) => {
      switch (status) {
        case 'unpaid': return { label: '待支付', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' };
        case 'pending': return { label: '待收货', color: 'text-zju-blue', bg: 'bg-zju-light/50', border: 'border-zju-blue/20' };
        case 'completed': return { label: '交易完成', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' };
        case 'cancelled': return { label: '已关闭', color: 'text-gray-400', bg: 'bg-gray-50', border: 'border-gray-100' };
        default: return { label: '未知', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-100' };
      }
    };

    return (
        <div className="max-w-[1000px] mx-auto flex flex-col gap-8 py-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black text-gray-800 mb-2">我的履约中心</h1>
                <p className="text-sm text-gray-500 font-medium">管理你在浙大二手的每一笔知识流转</p>
              </div>
              <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">正在进行</p>
                  <p className="text-xl font-black text-zju-blue">{MOCK_ORDERS.filter(o => ['unpaid', 'pending'].includes(o.status)).length}</p>
                </div>
                <div className="w-px h-8 bg-gray-100"></div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">累计成交</p>
                  <p className="text-xl font-black text-gray-800">{MOCK_ORDERS.filter(o => o.status === 'completed').length}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
                {tabs.map(tab => (
                    <button 
                      key={tab.id} 
                      onClick={() => setActiveTab(tab.id)} 
                      className={`flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === tab.id ? 'bg-zju-blue text-white shadow-lg shadow-zju-blue/20' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        {tab.label}
                        {MOCK_ORDERS.filter(o => o.status === tab.id).length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white text-zju-blue' : 'bg-gray-100 text-gray-400'}`}>
                            {MOCK_ORDERS.filter(o => o.status === tab.id).length}
                          </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-6">
                {filteredOrders.length > 0 ? filteredOrders.map(order => {
                  const statusInfo = getStatusInfo(order.status);
                  return (
                    <div key={order.id} className={`bg-white rounded-3xl border ${statusInfo.border} shadow-sm overflow-hidden hover:shadow-md transition-all`}>
                        <div className={`${statusInfo.bg} px-8 py-4 flex justify-between items-center border-b ${statusInfo.border}`}>
                            <div className="flex items-center gap-6 text-[11px] font-bold text-gray-400">
                                <span className="text-gray-600">{order.date}</span>
                                <span>订单号: TRD-{order.id.toUpperCase()}{Math.floor(Math.random()*10000)}</span>
                            </div>
                            <div className={`text-sm font-black ${statusInfo.color} flex items-center gap-1.5`}>
                              {order.status === 'unpaid' && <Clock className="w-4 h-4" />}
                              {order.status === 'pending' && <MapPin className="w-4 h-4" />}
                              {order.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                              {order.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                              {statusInfo.label}
                            </div>
                        </div>
                        
                        <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 flex gap-6">
                                <div className="relative group">
                                  <img src={order.cover} className="w-24 h-32 object-cover rounded-2xl border border-gray-100 shadow-md group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-all"></div>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h3 className="font-bold text-gray-800 text-xl mb-2">{order.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                      <div className="w-6 h-6 rounded-full bg-zju-light flex items-center justify-center text-[10px] font-bold text-zju-blue">
                                        {order.seller[0]}
                                      </div>
                                      卖家: <span className="font-bold text-gray-700">{order.seller}</span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">紫金港校区</span>
                                      <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 text-gray-500 rounded-lg border border-gray-100">当面交接</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="hidden md:block w-px h-24 bg-gray-50"></div>
                            
                            <div className="flex flex-col items-end gap-4 min-w-[220px]">
                                <div className="text-3xl font-black text-gray-800">¥ {order.price.toFixed(2)}</div>
                                <div className="flex gap-3">
                                    {order.status === 'unpaid' && (
                                      <>
                                        <button className="text-sm font-bold text-gray-400 hover:text-red-500 transition-colors">取消订单</button>
                                        <button className="bg-zju-blue text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-zju-blue/20 hover:bg-zju-hover hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                          <CreditCard className="w-4 h-4" /> 立即支付
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'pending' && (
                                      <>
                                        <button onClick={() => navigate('/messages')} className="bg-white border border-gray-200 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                                          联系卖家
                                        </button>
                                        <button className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-green-600/20 hover:bg-green-700 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                                          <CheckCircle2 className="w-4 h-4" /> 确认已收货
                                        </button>
                                      </>
                                    )}
                                    {order.status === 'completed' && (
                                      <button className="bg-white border-2 border-zju-blue text-zju-blue px-8 py-2.5 rounded-xl font-bold text-sm hover:bg-zju-light transition-all flex items-center gap-2">
                                        <Star className="w-4 h-4" /> 评价并获取积分
                                      </button>
                                    )}
                                    {order.status === 'cancelled' && (
                                      <button className="text-sm font-bold text-zju-blue hover:underline">重新购买</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                  );
                }) : (
                  <div className="bg-white rounded-3xl border border-gray-100 p-20 text-center flex flex-col items-center">
                    <Package className="w-16 h-16 text-gray-100 mb-4" />
                    <p className="text-gray-400 font-bold text-lg">暂无相关订单信息</p>
                    <button onClick={() => navigate('/books')} className="mt-4 text-zju-blue font-bold hover:underline">去购书大厅逛逛</button>
                  </div>
                )}
            </div>
        </div>
    );
};

export default Orders;
