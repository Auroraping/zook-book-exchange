import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, BookOpen, Star } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const SearchBooks = () => {
  const [activeTab, setActiveTab] = useState('综合排序');
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const filteredBooks = useMemo(() => {
    let list = [...MOCK_BOOKS]; // 仅使用原始 mock 数据
    if (query) {
      list = list.filter(book => 
        book.title.toLowerCase().includes(query.toLowerCase()) || 
        book.author.toLowerCase().includes(query.toLowerCase())
      );
    }
    return list;
  }, [query]);

  return (
    <div className="flex gap-8 items-start">
      {/* 左侧深层漏斗检索侧边栏 */}
      <aside className="w-[280px] bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-6 sticky top-[100px]">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <Filter className="text-gray-500 w-5 h-5"/>
          <h2 className="font-bold text-lg text-gray-800">精准筛选器</h2>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700">所属校区 (面交)</h4>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <label className="flex items-center gap-2 cursor-pointer hover:text-zju-blue"><input type="checkbox" className="accent-zju-blue" /> 紫金港校区本部</label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-zju-blue"><input type="checkbox" className="accent-zju-blue" /> 玉泉校区</label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-zju-blue"><input type="checkbox" className="accent-zju-blue" /> 西溪校区</label>
            <label className="flex items-center gap-2 cursor-pointer hover:text-zju-blue"><input type="checkbox" className="accent-zju-blue" /> 海宁国际校区</label>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700">学院/学科大类</h4>
          <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:border-zju-blue">
            <option>全部院系</option>
            <option>公共必修与思政类</option>
            <option>计算机科学与技术学院</option>
            <option>经济学院 / 管理学院</option>
            <option>竺可桢学院</option>
          </select>
        </div>

        <div>
          <h4 className="font-semibold text-sm mb-3 text-gray-700">特色要求</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 border border-zju-blue text-zju-blue bg-zju-light rounded-full cursor-pointer font-medium">带有配套笔记</span>
            <span className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50">自降底价区</span>
            <span className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50">成色 9成新之上</span>
            <span className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-full cursor-pointer hover:bg-gray-50">AI评分 &gt; 80</span>
          </div>
        </div>

        <button className="w-full mt-4 bg-[#f8fafc] text-zju-blue border border-gray-200 rounded-lg font-bold py-2.5 text-sm hover:border-zju-blue transition-colors">
          重置所有选项
        </button>
      </aside>

      {/* 右侧核心商品流瀑布 */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['综合排序', '价格从低到高', '最新发布', '同校区优先'].map(tab => (
              <span 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === tab ? 'bg-zju-blue text-white' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {tab}
              </span>
            ))}
          </div>
          <div className="text-sm font-medium text-gray-500">
            为您检索到 <span className="text-zju-blue font-bold">{filteredBooks.length}</span> 个匹配件
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {filteredBooks.map((book, idx) => (
            <Link to={`/book/${book.id}`} key={idx} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col">
              <div className="relative h-[220px] overflow-hidden">
                <img src={book.cover} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {book.aiScore && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-zju-blue to-[#0050ab] text-white text-[11px] px-2 py-1 flex items-center gap-1 rounded-md shadow-md font-bold">
                    <Star className="w-3 h-3 fill-white" /> AI 推荐指数 {book.aiScore}
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-800 mb-1 leading-snug line-clamp-2">{book.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{book.author}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">{book.condition}</span>
                  <span className="text-[10px] bg-blue-50 text-zju-blue px-1.5 py-0.5 rounded border border-blue-100">{book.campus}面交</span>
                  {idx % 3 === 0 && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded border border-green-100">可刀仪价</span>}
                </div>
                <div className="mt-auto flex justify-between items-end border-t border-gray-50 pt-3">
                  <div>
                    <span className="text-xl font-extrabold text-red-500">¥{book.price}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-400">{book.seller}</div>
                    <div className="text-[10px] text-yellow-500 font-bold">★ {book.credit} 信誉分</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* 底部缺省搜索 / 求书提示 */}
        <div className="mt-12 bg-white rounded-xl p-8 border border-dashed border-gray-300 text-center flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="font-bold text-gray-600 mb-2">没有找到适合您的指定教材版本？</h3>
            <p className="text-sm text-gray-400 mb-6 max-w-sm">别担心，在校园网内发布一条您的专属高悬赏“求书帖”，当有同学学完上架后，系统会自动用微信和邮件提示您！</p>
            <button className="bg-zju-blue text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-zju-hover hover:scale-105 transition-all text-sm">
                登记心仪书籍清单
            </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBooks;
