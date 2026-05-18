import { useMemo, useState } from 'react';
import { BookMarked, ChevronRight, FileText, Lock, Search, Sparkles, ThumbsUp } from 'lucide-react';
import { MOCK_NOTES } from '../mockData';

const filters = ['全部领域', '公共基础', '硬核理工', '经管社科'];

const Community = () => {
  const [activeFilter, setActiveFilter] = useState('全部领域');
  const [keyword, setKeyword] = useState('');

  const notes = useMemo(() => {
    const duplicatedNotes = [...MOCK_NOTES, ...MOCK_NOTES].map((note, index) => ({
      ...note,
      listId: `${note.id}-${index}`
    }));

    return duplicatedNotes.filter((note) => {
      const matchedKeyword = `${note.title}${note.course}${note.author}`.toLowerCase().includes(keyword.trim().toLowerCase());
      if (!matchedKeyword) return false;
      if (activeFilter === '全部领域') return true;
      if (activeFilter === '公共基础') return note.course.includes('高等数学');
      if (activeFilter === '硬核理工') return note.course.includes('数据结构');
      if (activeFilter === '经管社科') return note.course.includes('经济');
      return true;
    });
  }, [activeFilter, keyword]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
      <section className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-zju-blue to-blue-600 px-12 py-11 text-white">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookMarked className="w-5 h-5 text-blue-100" />
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100">Knowledge Community</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-4">求是知识共创社区</h1>
              <p className="text-blue-100 max-w-2xl text-sm leading-relaxed">
                课程笔记、历年真题、复习提纲和名词解释集中沉淀。桃酥会优先推荐与教材和课表相关的高价值资料。
              </p>
            </div>
            <div className="hidden lg:grid grid-cols-3 gap-3 w-[360px]">
              {[
                ['1245', '最高点赞'],
                ['3', '热载资料'],
                ['AI', '自动归档']
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-2xl font-black">{value}</p>
                  <p className="text-[10px] font-bold text-blue-100 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-9 max-w-3xl flex bg-white rounded-2xl shadow-xl shadow-blue-900/10 overflow-hidden">
            <div className="flex-1 h-14 px-6 flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                type="text"
                placeholder="搜索课程笔记、历届真题或名词解释..."
                className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400"
              />
            </div>
            <button className="px-8 bg-orange-500 text-white font-black text-sm hover:bg-orange-600 transition-colors flex items-center gap-2">
              挖掘资料 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-zju-blue text-[10px] font-black uppercase tracking-[0.25em] mb-3">
              <FileText className="w-4 h-4" /> Campus Picks
            </div>
            <h2 className="text-3xl font-black text-gray-900">本周校园热载榜</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-5 h-11 rounded-full text-xs font-black transition-all ${
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white border border-gray-100 text-gray-400 hover:text-gray-800'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {notes.map((note) => (
            <article key={note.listId} className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl transition-all group min-h-[220px] flex flex-col">
              <div className="flex justify-between items-start gap-3 mb-5">
                <span className="bg-blue-50 text-zju-blue text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 truncate max-w-[160px]">
                  {note.course}
                </span>
                {note.isPaid ? (
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1 whitespace-nowrap">
                    <Lock className="w-3 h-3" /> 积分兑换
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-100 whitespace-nowrap">
                    免费获取
                  </span>
                )}
              </div>

              <h3 className="font-black text-gray-900 text-lg leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                {note.title}
              </h3>

              <p className="text-sm text-gray-500 leading-relaxed mt-4 line-clamp-2">
                桃酥已自动关联课程与教材，可作为买书前后的复习资料补充。
              </p>

              <div className="mt-auto pt-5 border-t border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${note.author}`} alt={note.author} className="w-8 h-8 rounded-full border border-gray-100 bg-gray-50" />
                  <span className="text-xs text-gray-500 font-bold truncate max-w-[120px]">{note.author}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 text-xs font-black">
                  <ThumbsUp className="w-4 h-4" /> {note.likes}
                </div>
              </div>
            </article>
          ))}
        </div>

        {notes.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-[28px] py-24 text-center">
            <Sparkles className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-black">暂时没有匹配资料，换个关键词试试。</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Community;
