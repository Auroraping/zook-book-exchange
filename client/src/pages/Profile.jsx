import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Heart, BookMarked, Award, CreditCard, ChevronRight, Settings, ShieldCheck, Lock, Trash2, Calendar, Star, MessageSquare, Bell, Sparkles, Clock, XCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { MOCK_BOOKS, MOCK_USERS, MOCK_WISHES, MOCK_NOTIFICATIONS, MOCK_ORDERS } from '../mockData';

const Profile = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // URL中的用户ID
  const { user: currentUser, isLoggedIn, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'favorites' | 'listings' | 'wishes' | 'notifications'
  const [favorites, setFavorites] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', level: '' });

  const isOwnProfile = !id || (currentUser && id === currentUser.id);

  useEffect(() => {
    if (isOwnProfile) {
      if (isLoggedIn) {
        setProfileUser({
          id: currentUser?.id || 'me',
          name: currentUser?.name || '张同学',
          credit: 4.9,
          tradeCount: 15,
          level: 'V4 铂金买家',
          avatar: '/user_avatar.png',
          bio: currentUser?.bio || '浙大19级老学长，求购各种经管类书籍。',
          joinDate: '2023-10-01'
        });
        const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
        setFavorites(MOCK_BOOKS.filter(book => favIds.includes(book.id)));
      }
    } else {
      // 查找公共用户信息
      const foundUser = MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];
      setProfileUser(foundUser);
      setActiveTab('listings'); // 他人的个人主页默认看TA的在售书籍
    }
  }, [id, isLoggedIn, isOwnProfile, activeTab]);

  const removeFavorite = (id) => {
    const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavIds = favIds.filter(favId => favId !== id);
    localStorage.setItem('favorites', JSON.stringify(newFavIds));
    setFavorites(prev => prev.filter(b => b.id !== id));
  };

  if (!isLoggedIn && isOwnProfile) {
     return (
        <div className="max-w-[1000px] mx-auto py-12 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Lock className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">欢迎来到求书个人中心</h2>
            <p className="text-gray-500 mb-8 max-w-md">登录后即可查看您的买卖订单、学期省钱指数以及您收藏的心仪书籍。</p>
            <Link to="/login" className="bg-zju-blue text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-zju-blue/20 hover:shadow-zju-blue/40 transition-all hover:-translate-y-1">
                立即极速登录
            </Link>
        </div>
     );
  }

  if (!profileUser) return <div className="p-20 text-center text-gray-400">正在加载资料...</div>;

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
        {/* 顶部个人背景与基础资料卡片 */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="h-40 bg-gradient-to-r from-zju-blue to-blue-400 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            </div>
            <div className="px-12 pb-8 relative">
                <div className="flex justify-between items-end">
                    <div className="flex items-end gap-8 mt-[-60px]">
                        <div className="relative">
                            <img src={profileUser.avatar} className="w-40 h-40 rounded-3xl border-[6px] border-white shadow-xl bg-white object-cover" />
                            {profileUser.credit >= 4.8 && (
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg border-2 border-white">
                                    <Star className="w-5 h-5 fill-current" />
                                </div>
                            )}
                        </div>
                        <div className="mb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-3xl font-black text-gray-800">{profileUser.name}</h2>
                                <span className="px-2 py-0.5 bg-blue-50 text-zju-blue text-xs font-bold rounded border border-blue-100">{profileUser.level}</span>
                            </div>
                            <p className="text-gray-500 font-medium text-sm mb-4">{profileUser.bio}</p>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                    <Calendar className="w-4 h-4" /> 加入时间: {profileUser.joinDate}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                    <ShieldCheck className="w-4 h-4 text-green-500" /> 已通过浙大统一身份认证
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 mb-2">
                        {isOwnProfile ? (
                            <button 
                              onClick={() => {
                                setEditData({ name: profileUser.name, bio: profileUser.bio, level: profileUser.level });
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                            >
                                <Settings className="w-4 h-4" /> 编辑个人资料
                            </button>
                        ) : (
                            <>
                                <button className="flex items-center gap-2 px-6 py-2.5 bg-zju-blue text-white rounded-xl font-bold text-sm hover:bg-zju-hover shadow-lg shadow-zju-blue/20 transition-all">
                                    <MessageSquare className="w-4 h-4" /> 聊一聊
                                </button>
                                <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all">
                                    关注
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex gap-8">
            {/* 左侧资产菜单 */}
            <div className="w-[320px] shrink-0 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col gap-6">
                    <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">求书信誉体系</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-600">社区信誉评分</span>
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-lg font-black text-gray-800">{profileUser.credit}</span>
                                    <span className="text-xs text-gray-400">/ 5.0</span>
                                </div>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full rounded-full" style={{ width: `${profileUser.credit * 20}%` }}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                                    <p className="text-[10px] text-green-600 font-bold mb-1">成交订单</p>
                                    <p className="text-xl font-black text-green-700">{profileUser.tradeCount}</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                    <p className="text-[10px] text-blue-600 font-bold mb-1">好评率</p>
                                    <p className="text-xl font-black text-blue-700">100%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    

                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                    {isOwnProfile && (
                        <>
                            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${activeTab === 'orders' ? 'bg-zju-light/50' : 'hover:bg-gray-50'}`}>
                                <div className={`flex items-center gap-3 text-sm font-semibold ${activeTab === 'orders' ? 'text-zju-blue' : 'text-gray-700 group-hover:text-zju-blue'}`}>
                                    <Package className={`w-5 h-5 ${activeTab === 'orders' ? 'text-zju-blue' : 'text-gray-400 group-hover:text-zju-blue'}`} /> 我的买卖订单
                                </div>
                                <ChevronRight className={`w-4 h-4 ${activeTab === 'orders' ? 'text-zju-blue' : 'text-gray-300'}`} />
                            </button>
                            <button onClick={() => setActiveTab('favorites')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${activeTab === 'favorites' ? 'bg-zju-light/50' : 'hover:bg-gray-50'}`}>
                                <div className={`flex items-center gap-3 text-sm font-semibold ${activeTab === 'favorites' ? 'text-zju-blue' : 'text-gray-700 group-hover:text-zju-blue'}`}>
                                    <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'text-zju-blue' : 'text-gray-400 group-hover:text-zju-blue'}`} /> 我收藏的心仪书籍
                                </div>
                                <ChevronRight className={`w-4 h-4 ${activeTab === 'favorites' ? 'text-zju-blue' : 'text-gray-300'}`} />
                            </button>
                            <button onClick={() => setActiveTab('wishes')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${activeTab === 'wishes' ? 'bg-zju-light/50' : 'hover:bg-gray-50'}`}>
                                <div className={`flex items-center gap-3 text-sm font-semibold ${activeTab === 'wishes' ? 'text-zju-blue' : 'text-gray-700 group-hover:text-zju-blue'}`}>
                                    <Sparkles className={`w-5 h-5 ${activeTab === 'wishes' ? 'text-zju-blue' : 'text-gray-400 group-hover:text-zju-blue'}`} /> 购书心愿单
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-zju-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{MOCK_WISHES.length}</span>
                                  <ChevronRight className={`w-4 h-4 ${activeTab === 'wishes' ? 'text-zju-blue' : 'text-gray-300'}`} />
                                </div>
                            </button>
                            <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${activeTab === 'notifications' ? 'bg-zju-light/50' : 'hover:bg-gray-50'}`}>
                                <div className={`flex items-center gap-3 text-sm font-semibold ${activeTab === 'notifications' ? 'text-zju-blue' : 'text-gray-700 group-hover:text-zju-blue'}`}>
                                    <Bell className={`w-5 h-5 ${activeTab === 'notifications' ? 'text-zju-blue' : 'text-gray-400 group-hover:text-zju-blue'}`} /> 消息通知中心
                                </div>
                                <div className="flex items-center gap-2">
                                  {MOCK_NOTIFICATIONS.some(n => !n.isRead) && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                                  <ChevronRight className={`w-4 h-4 ${activeTab === 'notifications' ? 'text-zju-blue' : 'text-gray-300'}`} />
                                </div>
                            </button>

                        </>
                    )}
                    <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group ${activeTab === 'listings' ? 'bg-zju-light/50' : 'hover:bg-gray-50'}`}>
                        <div className={`flex items-center gap-3 text-sm font-semibold ${activeTab === 'listings' ? 'text-zju-blue' : 'text-gray-700 group-hover:text-zju-blue'}`}>
                            <BookMarked className={`w-5 h-5 ${activeTab === 'listings' ? 'text-zju-blue' : 'text-gray-400 group-hover:text-zju-blue'}`} /> {isOwnProfile ? '我发布的书籍' : 'TA发布的书籍'}
                        </div>
                        <ChevronRight className={`w-4 h-4 ${activeTab === 'listings' ? 'text-zju-blue' : 'text-gray-300'}`} />
                    </button>
                </div>
            </div>

            {/* 右侧内容面板 */}
            <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-black text-gray-800 text-xl">
                      {activeTab === 'orders' && '我的履约订单'}
                      {activeTab === 'favorites' && '我收藏的心仪书籍'}
                      {activeTab === 'wishes' && '我的购书心愿清单'}
                      {activeTab === 'notifications' && '消息通知中心'}

                      {activeTab === 'listings' && (isOwnProfile ? '我正在出售的书籍' : `${profileUser.name} 的书架`)}
                    </h3>
                </div>
                
                <div className="p-8 flex flex-col gap-6">
                    {activeTab === 'orders' && isOwnProfile && (
                        <div className="flex flex-col gap-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm text-gray-500 font-medium">查看并管理你的购书流水</p>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 bg-gray-50 text-gray-400 text-[10px] font-bold rounded-full border border-gray-100">进行中 ({MOCK_ORDERS.filter(o => ['unpaid', 'pending'].includes(o.status)).length})</span>
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100">已成交 ({MOCK_ORDERS.filter(o => o.status === 'completed').length})</span>
                                </div>
                            </div>
                            
                            {MOCK_ORDERS.map(order => (
                                <div key={order.id} className="group border border-gray-100 rounded-3xl p-6 hover:border-zju-blue/30 hover:shadow-md transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex gap-6">
                                            <div className="relative">
                                              <img src={order.cover} className="w-20 h-28 bg-gray-50 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                                              {order.status === 'unpaid' && (
                                                <div className="absolute -top-2 -right-2 bg-orange-500 text-white p-1.5 rounded-lg shadow-lg">
                                                  <Clock className="w-3 h-3" />
                                                </div>
                                              )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-zju-blue transition-colors">{order.title}</h4>
                                                <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                                                  卖家: <span className="text-gray-600 font-bold">{order.seller}</span>
                                                  <span className="mx-2">·</span>
                                                  交易单号: {order.id.toUpperCase()}
                                                </p>
                                                <div className="flex gap-2">
                                                    {order.status === 'unpaid' && <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded border border-orange-100">待买家支付</span>}
                                                    {order.status === 'pending' && <span className="px-2 py-0.5 bg-blue-50 text-zju-blue text-[10px] font-bold rounded border border-blue-100">待当面交付</span>}
                                                    {order.status === 'completed' && <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100">交易已圆满</span>}
                                                    {order.status === 'cancelled' && <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[10px] font-bold rounded border border-gray-100">交易已关闭</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-800">¥ {order.price.toFixed(2)}</p>
                                            <p className="text-[10px] text-gray-400 mt-1 font-bold">{order.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); alert('正在调取订单详细履约记录...'); }}
                                          className="px-5 py-2 text-xs font-bold text-gray-500 hover:text-zju-blue hover:bg-gray-50 rounded-lg transition-all"
                                        >
                                          详情
                                        </button>
                                        {order.status === 'unpaid' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); alert('正在跳转至浙大统一支付平台...'); }}
                                            className="px-6 py-2 bg-zju-blue text-white rounded-xl font-bold text-xs shadow-lg shadow-zju-blue/20 hover:bg-zju-hover hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                          >
                                            立即支付
                                          </button>
                                        )}
                                        {order.status === 'pending' && (
                                          <button 
                                            onClick={(e) => { 
                                              e.stopPropagation(); 
                                              if(window.confirm('确认已收到书籍并完成当面核验吗？')) {
                                                alert('交易成功！感谢您为知识流转做出的贡献。');
                                              }
                                            }}
                                            className="px-6 py-2 bg-green-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-600/20 hover:bg-green-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                          >
                                            确认收货
                                          </button>
                                        )}
                                        {order.status === 'completed' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); navigate('/evaluate/' + order.id); }}
                                            className="px-6 py-2 bg-white border-2 border-zju-blue text-zju-blue rounded-xl font-bold text-xs hover:bg-zju-light hover:-translate-y-0.5 active:translate-y-0 transition-all"
                                          >
                                            评价回馈积分
                                          </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'favorites' && isOwnProfile && (
                        <div className="grid grid-cols-2 gap-6">
                            {favorites.length > 0 ? favorites.map(book => (
                                <Link to={`/book/${book.id}`} key={book.id} className="flex gap-4 p-4 rounded-3xl border border-gray-100 hover:border-zju-blue/30 hover:shadow-lg transition-all group relative bg-white">
                                    <img src={book.cover} className="w-20 h-28 object-cover rounded-2xl shadow-sm" />
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-zju-blue transition-colors line-clamp-2">{book.title}</h4>
                                        <p className="text-[10px] text-gray-400 mb-3 font-medium">{book.campus}校区</p>
                                        <div className="text-xl font-black text-red-500">¥ {book.price}</div>
                                    </div>
                                    <button 
                                      onClick={(e) => { e.preventDefault(); removeFavorite(book.id); }} 
                                      className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                      title="移出收藏夹"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </Link>
                            )) : (
                                <div className="col-span-2 py-20 text-center flex flex-col items-center">
                                    <Heart className="w-16 h-16 text-gray-100 mb-4" />
                                    <p className="text-gray-400 font-black">你的收藏夹空空如也</p>
                                    <Link to="/books" className="mt-4 text-zju-blue font-bold text-sm hover:underline">去发现好书</Link>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'listings' && (
                        <div className="grid grid-cols-3 gap-6">
                            {MOCK_BOOKS.filter(b => b.seller === profileUser.name && b.status === 'approved').map(book => (
                                <Link to={`/book/${book.id}`} key={book.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all group flex flex-col">
                                    <div className="h-44 overflow-hidden relative">
                                        <img src={book.cover} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-zju-blue text-[10px] font-black px-2 py-1 rounded-lg shadow-sm border border-zju-blue/10">{book.condition}</div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 className="font-bold text-gray-800 text-xs mb-3 line-clamp-2 group-hover:text-zju-blue transition-colors">{book.title}</h4>
                                        <div className="mt-auto flex justify-between items-end">
                                          <div className="text-xl font-black text-gray-800">¥ {book.price}</div>
                                          <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1">{book.campus}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {MOCK_BOOKS.filter(b => b.seller === profileUser.name && b.status === 'approved').length === 0 && (
                                <div className="col-span-3 py-24 text-center">
                                  <BookMarked className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                  <p className="text-gray-400 font-black">暂无上架书籍</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'wishes' && isOwnProfile && (
                        <div className="flex flex-col gap-6">
                            {MOCK_WISHES.filter(w => w.userId === 'me').length > 0 ? (
                                <div className="space-y-4">
                                    {MOCK_WISHES.filter(w => w.userId === 'me').map(wish => (
                                        <div key={wish.id} className="bg-gray-50 rounded-3xl p-8 border border-gray-100 relative group overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                                <Sparkles className="w-20 h-20" />
                                            </div>
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="text-xl font-black text-gray-800">{wish.title}</h4>
                                                        <span className="px-3 py-1 bg-zju-blue/10 text-zju-blue text-[10px] font-black rounded-full flex items-center gap-2 border border-zju-blue/20">
                                                            <div className="w-1.5 h-1.5 bg-zju-blue rounded-full animate-pulse"></div>
                                                            全校实时监控中
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-6 font-medium">作者要求: <span className="text-gray-700">{wish.author || '任意'}</span> | 期望价格区间: <span className="text-zju-blue font-bold">¥{wish.priceRange}</span></p>
                                                    <div className="flex items-center gap-4 bg-white/50 p-3 rounded-2xl border border-gray-100 w-fit">
                                                        <div className="flex -space-x-2">
                                                            {[1,2,3].map(i => (
                                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-300">?</div>
                                                            ))}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed">系统正在为您进行跨校区实时比对...<br/>如有匹配将立刻通过“求书”App推送</p>
                                                    </div>
                                                </div>
                                                <button className="p-3 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <Sparkles className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                    <p className="text-gray-400 font-black">还没有登记任何心愿</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'notifications' && isOwnProfile && (
                        <div className="flex flex-col gap-4">
                            {MOCK_NOTIFICATIONS.length > 0 ? (
                                <div className="space-y-4">
                                    {MOCK_NOTIFICATIONS.map(notif => (
                                        <div key={notif.id} className={`p-6 rounded-3xl border transition-all flex gap-6 ${notif.isRead ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-zju-blue/10 shadow-sm'}`}>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${notif.type === 'wish_match' ? 'bg-zju-light text-zju-blue' : 'bg-gray-100 text-gray-500'}`}>
                                                {notif.type === 'wish_match' ? <Sparkles className="w-7 h-7" /> : <Bell className="w-7 h-7" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-black text-gray-800 text-lg">{notif.title}</h4>
                                                    <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded-lg">{notif.timestamp}</span>
                                                </div>
                                                <p className="text-sm text-gray-500 leading-relaxed mb-6 font-medium">{notif.content}</p>
                                                {notif.bookId && (
                                                    <Link to={`/book/${notif.bookId}`} className="inline-flex items-center gap-2 bg-zju-blue text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-zju-blue/20 hover:bg-zju-hover hover:-translate-y-0.5 transition-all">
                                                        立即去看看那本书 <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-24 text-center">
                                    <Bell className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                    <p className="text-gray-400 font-black">暂无消息通知</p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
      {/* 编辑资料模态框 */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="bg-white rounded-[32px] w-full max-w-[500px] relative z-10 shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="bg-gradient-to-br from-zju-blue to-blue-600 p-8 text-white">
              <h3 className="text-2xl font-black mb-1">编辑个人资料</h3>
              <p className="text-white/70 text-xs font-medium">完善你的信息，让校友更了解你</p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex justify-center mb-4">
                <div className="relative group cursor-pointer">
                  <img src={profileUser.avatar} className="w-24 h-24 rounded-3xl border-4 border-gray-50 shadow-md object-cover group-hover:opacity-75 transition-all" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">昵称</label>
                <input 
                  type="text" 
                  value={editData.name} 
                  onChange={(e) => setEditData({...editData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-zju-blue/20 focus:border-zju-blue transition-all"
                  placeholder="给自己起个好听的名字"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">个性签名</label>
                <textarea 
                  value={editData.bio} 
                  onChange={(e) => setEditData({...editData, bio: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-3.5 font-medium text-gray-600 focus:outline-none focus:ring-2 focus:ring-zju-blue/20 focus:border-zju-blue transition-all min-h-[100px] resize-none"
                  placeholder="写点什么介绍下自己吧..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    const newData = { name: editData.name, bio: editData.bio };
                    setProfileUser({ ...profileUser, ...newData });
                    updateUser(newData);
                    setIsEditModalOpen(false);
                    alert('资料保存成功！');
                  }}
                  className="flex-[2] px-8 py-4 bg-zju-blue text-white rounded-2xl font-black text-sm shadow-xl shadow-zju-blue/20 hover:bg-zju-hover hover:-translate-y-0.5 transition-all"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
