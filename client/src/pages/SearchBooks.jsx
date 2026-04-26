import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, BookOpen, ChevronRight, Search as SearchIcon, SlidersHorizontal, Sparkles } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const SearchBooks = () => {
  const [activeSort, setActiveSort] = useState('综合');
  const [showWishModal, setShowWishModal] = useState(false);
  const [selectedCampuses, setSelectedCampuses] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('全部院系');
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const toggleCampus = (campus) => {
    setSelectedCampuses(prev => 
      prev.includes(campus) 
        ? prev.filter(c => c !== campus) 
        : [...prev, campus]
    );
  };

  const resetFilters = () => {
    setSelectedCampuses([]);
    setSelectedCategory('全部院系');
    setActiveSort('综合');
  };

  const filteredBooks = useMemo(() => {
    let list = MOCK_BOOKS.filter(book => book.status === 'approved');
    
    if (query) {
      list = list.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) || 
        book.author.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (selectedCampuses.length > 0) {
      list = list.filter(book => selectedCampuses.some(campus => campus.includes(book.campus)));
    }

    if (selectedCategory !== '全部院系') {
      list = list.filter(book => book.category === selectedCategory);
    }

    if (activeSort === '价格') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (activeSort === '最新') {
      list = [...list].sort((a, b) => b.id - a.id);
    }

    return list;
  }, [query, selectedCampuses, selectedCategory, activeSort]);

  return (
    <div className="flex gap-16 items-start animate-google-in pt-4">
      {/* 高级侧边筛选器 */}
      <aside className="w-[320px] shrink-0 sticky top-32">
        <div className="premium-card p-10 !rounded-[40px] shadow-2xl shadow-blue-900/5">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
               <SlidersHorizontal className="w-6 h-6"/>
            </div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Filters</h2>
          </div>

          <div className="space-y-12">
            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-gray-200"></div> 校区分布
              </h4>
              <div className="flex flex-col gap-4">
                {['紫金港校区', '玉泉校区', '西溪校区', '华家池校区'].map(campus => {
                  const isChecked = selectedCampuses.includes(campus);
                  return (
                    <label key={campus} className="flex items-center gap-4 cursor-pointer group">
                      <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-blue-600 border-blue-600 shadow-md' : 'border-gray-200 group-hover:border-blue-400'}`}>
                         <input 
                           type="checkbox" 
                           className="hidden" 
                           checked={isChecked}
                           onChange={() => toggleCampus(campus)}
                         />
                         {isChecked && (
                           <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                             <path d="M5 13l4 4L19 7" />
                           </svg>
                         )}
                      </div>
                      <span className={`text-sm font-bold transition-colors ${isChecked ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-900'}`}>{campus}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-gray-200"></div> 学科分类
              </h4>
              <div className="relative group">
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-[18px] h-14 px-6 text-sm font-bold text-gray-800 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer appearance-none"
                >
                    <option value="全部院系">全部院系</option>
                    <option value="公共必修与思政类">公共必修与思政类</option>
                    <option value="计算机科学与技术">计算机科学与技术</option>
                    <option value="经济与管理">经济与管理</option>
                    <option value="外语学习">外语学习</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={resetFilters}
                className="w-full h-14 bg-gray-900 text-white rounded-full text-sm font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>

        {/* 动态心愿单入口 */}
        <div className="mt-8 premium-card p-10 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-2xl relative overflow-hidden group">
           <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
           <Sparkles className="w-10 h-10 mb-6 text-yellow-300" />
           <h4 className="text-xl font-black mb-3">没找到需要的书？</h4>
           <p className="text-xs text-white/70 leading-relaxed mb-8 font-medium">登记您的心愿清单，求是书缘 AI 将为您全校实时监控。</p>
           <button 
             onClick={() => setShowWishModal(true)}
             className="w-full py-4 bg-white text-indigo-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-[0_10px_30px_rgba(255,255,255,0.3)] transition-all active:scale-95"
           >
              Make a Wish
           </button>
        </div>
      </aside>

      {/* 右侧商品流 */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="flex flex-wrap gap-3">
            {['综合', '价格', '最新', '成色'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveSort(tab)}
                className={`px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeSort === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white text-gray-400 hover:text-gray-800'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
            Found <span className="text-gray-900">{filteredBooks.length}</span> Masterpieces
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBooks.map((book) => (
            <Link to={`/book/${book.id}`} key={book.id} className="group">
              <div className="premium-card !p-0 overflow-hidden !rounded-[40px] h-full flex flex-col">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute top-6 left-6">
                     <span className="px-4 py-1.5 bg-white/90 backdrop-blur text-[10px] font-black text-gray-900 rounded-full shadow-lg border border-white/50">{book.condition}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 truncate group-hover:text-blue-600 transition-colors">{book.title}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">{book.campus}校区 · {book.author}</p>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-50 pt-6 mt-auto">
                    <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Exchange</p>
                        <span className="text-3xl font-black text-gray-900">¥{book.price}</span>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 shadow-xl shadow-blue-500/40">
                        <ChevronRight className="w-7 h-7" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="py-40 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <BookOpen className="w-12 h-12 text-gray-200" />
            </div>
            <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tight uppercase">Nothing Found</h3>
            <p className="text-gray-400 font-medium text-lg">尝试调整您的过滤器，或者开启一个心愿单。</p>
          </div>
        )}
      </div>

      {/* 极简模态框 */}
      {showWishModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setShowWishModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[48px] shadow-2xl p-16 animate-google-in border border-white/20">
            <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tighter">MAKE A WISH</h2>
            <p className="text-lg text-gray-500 mb-12 font-medium">我们将为您在全校范围内实时监控每一个知识的脉动。</p>
            
            <div className="space-y-8">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-4">Book Title</label>
                <div className="h-16 bg-gray-50 rounded-[20px] px-8 flex items-center gap-4 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100 transition-all border border-transparent">
                    <SearchIcon className="w-6 h-6 text-gray-400" />
                    <input type="text" className="w-full bg-transparent border-none focus:ring-0 text-lg font-bold text-gray-900" placeholder="书名、作者、ISBN..." />
                </div>
              </div>
              <button 
                onClick={() => setShowWishModal(false)}
                className="w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[24px] font-black text-xl uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:scale-[1.02] transition-transform active:scale-95"
              >
                Submit Wish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBooks;
