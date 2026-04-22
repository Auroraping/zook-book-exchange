import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Heart, BookMarked, Award, CreditCard, ChevronRight, Settings, ShieldCheck, Lock, Trash2, Calendar, Star, MessageSquare } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { MOCK_BOOKS, MOCK_USERS } from '../mockData';

const Profile = () => {
  const { id } = useParams(); // URL中的用户ID
  const { user: currentUser, isLoggedIn } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'favorites' | 'listings'
  const [favorites, setFavorites] = useState([]);
  const [profileUser, setProfileUser] = useState(null);

  const isOwnProfile = !id || (currentUser && id === currentUser.id);

  useEffect(() => {
    if (isOwnProfile) {
      if (isLoggedIn) {
        setProfileUser({
          id: 'me',
          name: '张同学',
          credit: 4.9,
          tradeCount: 15,
          level: 'V4 铂金买家',
          avatar: '/user_avatar.png',
          bio: '浙大19级老学长，求购各种经管类书籍。',
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
                            <button className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all">
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
                    
                    {isOwnProfile && (
                        <div className="bg-zju-light p-4 rounded-2xl border border-zju-blue/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-zju-blue">我的省钱指数</span>
                                <Award className="w-4 h-4 text-zju-blue" />
                            </div>
                            <p className="text-2xl font-black text-zju-blue mb-1">¥ 1245.5</p>
                            <p className="text-[10px] text-zju-hover">已成功通过二手流转节约了 70% 的教材支出</p>
                        </div>
                    )}
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
                      {activeTab === 'orders' && '最近进行的履约'}
                      {activeTab === 'favorites' && '我收藏的心仪书籍'}
                      {activeTab === 'listings' && (isOwnProfile ? '我正在出售的书籍' : `${profileUser.name} 的书架`)}
                    </h3>
                </div>
                
                <div className="p-8 flex flex-col gap-6">
                    {activeTab === 'orders' && isOwnProfile && (
                        <div className="flex items-center gap-6 p-6 rounded-2xl border border-gray-100 bg-gray-50/30">
                            <img src="/book_economics.png" className="w-16 h-20 object-cover rounded-xl shadow-md" />
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1">微观经济学：现代观点</h4>
                                <p className="text-xs text-gray-400">交易编号: #TRD-08221 | 交付地: 西溪校区正门</p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-red-500 mb-1">¥ 45.0</div>
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold">待见面交付</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'favorites' && isOwnProfile && (
                        <div className="grid grid-cols-2 gap-6">
                            {favorites.length > 0 ? favorites.map(book => (
                                <Link to={`/book/${book.id}`} key={book.id} className="flex gap-4 p-4 rounded-2xl border border-gray-100 hover:border-zju-blue/30 hover:shadow-md transition-all group">
                                    <img src={book.cover} className="w-16 h-20 object-cover rounded-xl shadow-sm" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800 text-sm mb-1 group-hover:text-zju-blue">{book.title}</h4>
                                        <p className="text-[10px] text-gray-400 mb-2">{book.campus}</p>
                                        <div className="text-lg font-black text-zju-blue">¥ {book.price}</div>
                                    </div>
                                    <button onClick={(e) => { e.preventDefault(); removeFavorite(book.id); }} className="h-fit p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </Link>
                            )) : (
                                <div className="col-span-2 py-20 text-center flex flex-col items-center">
                                    <Heart className="w-16 h-16 text-gray-100 mb-4" />
                                    <p className="text-gray-400 font-bold">还没有任何收藏哦</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'listings' && (
                        <div className="grid grid-cols-3 gap-6">
                            {MOCK_BOOKS.filter(b => b.seller === profileUser.name && b.status === 'approved').map(book => (
                                <Link to={`/book/${book.id}`} key={book.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-all group flex flex-col">
                                    <div className="h-40 overflow-hidden relative">
                                        <img src={book.cover} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" />
                                        <div className="absolute top-2 left-2 bg-white/90 text-zju-blue text-[10px] font-bold px-2 py-1 rounded shadow-sm">{book.condition}</div>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col">
                                        <h4 className="font-bold text-gray-800 text-xs mb-2 line-clamp-2">{book.title}</h4>
                                        <div className="mt-auto text-lg font-black text-red-500">¥ {book.price}</div>
                                    </div>
                                </Link>
                            ))}
                            {MOCK_BOOKS.filter(b => b.seller === profileUser.name).length === 0 && (
                                <div className="col-span-3 py-20 text-center text-gray-400 font-bold">暂无上架书籍</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
