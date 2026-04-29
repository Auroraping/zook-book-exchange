import React, { useState } from 'react';
import { MOCK_WISHES } from '../mockData';
import { Heart, MessageSquare, Plus, Search, Sparkles, Filter, CheckCircle2, Clock } from 'lucide-react';

const WishSquare = () => {
  const [wishes, setWishes] = useState(MOCK_WISHES);
  const [filter, setFilter] = useState('all'); // all, seeking, fulfilled
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWish, setNewWish] = useState({ title: '', author: '', priceRange: '', tags: '' });
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredWishes = wishes.filter(wish => {
    const matchesFilter = filter === 'all' ? true : wish.status === filter;
    const matchesSearch = wish.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          wish.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wish.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const wishToAdd = {
      id: `w${wishes.length + 1}`,
      userId: 'me',
      userName: '求是校友',
      title: newWish.title,
      author: newWish.author,
      priceRange: newWish.priceRange,
      status: 'seeking',
      tags: newWish.tags.split(',').map(t => t.trim()),
      timestamp: '刚刚',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
    };
    setWishes([wishToAdd, ...wishes]);
    setIsModalOpen(false);
    setNewWish({ title: '', author: '', priceRange: '', tags: '' });
    triggerToast('心愿已发布！等待有缘人发现~');
  };

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          <span className="font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-600 to-indigo-700 p-12 text-white shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-4 h-4" />
            求是心愿清单
          </div>
          <h1 className="text-5xl font-black mb-4 tracking-tight leading-tight">
            心愿广场
          </h1>
          <p className="text-lg text-purple-100 font-medium leading-relaxed">
            找不到想要的书？在这里大声说出来！全校同学都在为你寻宝。
            发布你的求书愿望，让知识在求是园里流转。
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-white text-purple-700 rounded-2xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl"
            >
              <Plus className="w-5 h-5" />
              发布我的心愿
            </button>
            <div className="relative flex items-center">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`px-8 py-4 ${showSearch ? 'bg-purple-400/40 w-12 px-0' : 'bg-purple-500/30'} backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold hover:bg-purple-500/40 transition-all flex items-center justify-center gap-2`}
              >
                <Search className="w-5 h-5" />
                {!showSearch && "搜索心愿"}
              </button>
              {showSearch && (
                <input
                  autoFocus
                  type="text"
                  placeholder="搜索书名、作者或标签..."
                  className="ml-2 px-6 py-4 bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-2xl placeholder:text-purple-200 outline-none w-64 animate-in slide-in-from-left-4 duration-300 font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-[-10%] right-[-5%] w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[40%] w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        <Heart className="absolute right-12 bottom-12 w-32 h-32 text-white/10 -rotate-12" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 backdrop-blur-sm rounded-2xl w-fit border border-gray-200/50">
          {[
            { id: 'all', label: '全部心愿', icon: <Filter className="w-4 h-4" /> },
            { id: 'seeking', label: '寻找中', icon: <Clock className="w-4 h-4" /> },
            { id: 'fulfilled', label: '已达成', icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                filter === item.id 
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        
        <div className="text-sm font-medium text-gray-400">
          共有 <span className="text-gray-900 font-bold">{filteredWishes.length}</span> 个心愿正在等待达成
        </div>
      </div>

      {/* Wishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWishes.map((wish, index) => (
          <div 
            key={wish.id}
            className="group relative bg-white border border-gray-100 rounded-[28px] p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-gray-50 group-hover:ring-purple-100 transition-all">
                  <img src={wish.avatar} alt={wish.userName} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{wish.userName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{wish.timestamp}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                wish.status === 'fulfilled' 
                ? 'bg-emerald-50 text-emerald-600' 
                : 'bg-amber-50 text-amber-600'
              }`}>
                {wish.status === 'fulfilled' ? '达成' : '寻觅中'}
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              《{wish.title}》
            </h3>
            <p className="text-sm text-gray-500 font-medium mb-4 line-clamp-1">
              作者：{wish.author}
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {wish.tags.map(tag => (
                <span key={tag} className="px-3 py-1 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-bold">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-50">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">预估预算</p>
                <p className="text-lg font-black text-gray-900">¥{wish.priceRange}</p>
              </div>
              <button 
                onClick={() => triggerToast('已发送私聊请求，快去和Ta沟通吧！')}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-purple-600 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                我有此书
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-3xl font-black mb-6 tracking-tight text-gray-900">发布新心愿</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">书名</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  placeholder="你想求的书籍全名"
                  value={newWish.title}
                  onChange={e => setNewWish({...newWish, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">作者</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                    placeholder="原作者"
                    value={newWish.author}
                    onChange={e => setNewWish({...newWish, author: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">预算范围 (¥)</label>
                  <input 
                    type="text" 
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                    placeholder="如: 20-30"
                    value={newWish.priceRange}
                    onChange={e => setNewWish({...newWish, priceRange: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-2 ml-1">标签 (用逗号分隔)</label>
                <input 
                  type="text" 
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-purple-500 transition-all font-medium"
                  placeholder="如: 教材, 计算机, 考研"
                  value={newWish.tags}
                  onChange={e => setNewWish({...newWish, tags: e.target.value})}
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-[2] px-6 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-purple-600 transition-all shadow-lg"
                >
                  确认发布
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredWishes.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-300 mb-6">
            <Heart className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">暂无匹配心愿</h3>
          <p className="text-gray-500 font-medium">换个过滤条件试试，或者发布你自己的第一个心愿吧！</p>
        </div>
      )}
    </div>
  );
};

export default WishSquare;
