import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen, Star, Search, ChevronRight } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const SearchBooks = () => {
  const [activeTab, setActiveTab] = useState('综合排序');
  const [showWishModal, setShowWishModal] = useState(false);
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredBooks = useMemo(() => {
    let list = MOCK_BOOKS.filter(book => book.status === 'approved');
    if (query) {
      list = list.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) || 
        book.author.toLowerCase().includes(query.toLowerCase())
      );
    }
    return list;
  }, [query]);

  return (
    <div className="flex gap-10 items-start animate-m3-in">
      {/* 左侧 M3 侧边筛选器 */}
      <aside className="w-[300px] shrink-0 sticky top-24">
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-m3-blue-container text-m3-blue flex items-center justify-center">
               <Filter className="w-5 h-5"/>
            </div>
            <h2 className="text-xl font-medium text-gray-800">筛选</h2>
          </div>

          <div className="space-y-8">
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">所属校区</h4>
              <div className="flex flex-col gap-3">
                {['紫金港校区', '玉泉校区', '西溪校区', '华家池校区'].map(campus => (
                  <label key={campus} className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-5 h-5 rounded-md border-2 border-gray-200 group-hover:border-m3-blue transition-colors flex items-center justify-center">
                       <input type="checkbox" className="hidden" />
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-m3-blue transition-colors">{campus}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">学科分类</h4>
              <select className="w-full bg-m3-surface-container/50 border-none rounded-2xl h-12 px-4 text-sm text-gray-700 focus:bg-white focus:ring-2 focus:ring-m3-blue/20 transition-all">
                <option>全部院系</option>
                <option>公共必修与思政类</option>
                <option>计算机科学与技术</option>
                <option>经济与管理</option>
              </select>
            </div>

            <div className="pt-4">
              <button className="w-full h-12 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors">
                重置所有
              </button>
            </div>
          </div>
        </div>

        {/* 辅助入口 */}
        <div className="mt-6 bg-m3-blue-container/30 rounded-[32px] p-8 border border-m3-blue/10">
           <h4 className="text-sm font-bold text-m3-blue mb-2">没找到书？</h4>
           <p className="text-xs text-m3-blue/70 leading-relaxed mb-6">登记您的心愿清单，系统将在全校范围内为您守候。</p>
           <button 
             onClick={() => setShowWishModal(true)}
             className="w-full py-3 bg-m3-blue text-white rounded-2xl text-xs font-bold shadow-lg shadow-m3-blue/20 hover:scale-105 transition-transform"
           >
              发布购书心愿单
           </button>
        </div>
      </aside>

      {/* 右侧主商品流 */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-10 px-2">
          <div className="flex gap-1">
            {['综合', '价格', '最新', '成色'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 text-sm font-medium rounded-full transition-all ${activeTab === tab ? 'bg-m3-blue text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-sm text-gray-400">
            共 <span className="text-gray-900 font-medium">{filteredBooks.length}</span> 本
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {filteredBooks.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <div className="m3-tile !p-0 overflow-hidden group-hover:shadow-md">
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                     <span className="px-2 py-1 bg-white/90 backdrop-blur text-[9px] font-bold text-gray-800 rounded-md shadow-sm">{book.condition}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-1 truncate">{book.title}</h3>
                  <p className="text-xs text-gray-400 mb-6">{book.campus}校区 · {book.author}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-normal text-gray-900">¥{book.price}</span>
                    <div className="w-8 h-8 rounded-full bg-m3-blue-container text-m3-blue flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="py-32 text-center">
            <BookOpen className="w-16 h-16 text-gray-100 mx-auto mb-6" />
            <h3 className="text-2xl font-normal text-gray-800 mb-2">未找到匹配书籍</h3>
            <p className="text-gray-400">试试更换关键词或在左侧发布心愿单</p>
          </div>
        )}
      </div>

      {/* M3 风格模态框 */}
      {showWishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowWishModal(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-10 animate-m3-in">
            <h2 className="text-3xl font-normal text-gray-900 mb-2">登记心愿</h2>
            <p className="text-sm text-gray-500 mb-8">我们将为您在全校范围内实时监控。</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">书籍名称</label>
                <input type="text" className="m3-search-bar !bg-gray-50 focus:!bg-white" placeholder="请输入完整书名..." />
              </div>
              <button 
                onClick={() => setShowWishModal(false)}
                className="w-full m3-fab !bg-m3-blue !text-white justify-center py-5 mt-4"
              >
                确认提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
