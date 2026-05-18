import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  DownloadCloud,
  Link2,
  Plus,
  RefreshCw,
  Sparkles,
  UploadCloud,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_BOOKS, MOCK_COURSES } from '../mockData';

const SCHEDULE_STORAGE_KEY = 'zookBoundSchedule';

const COURSE_LIBRARY = [
  { ...MOCK_COURSES[0], time: '周一 1-2 节', location: '紫金港西 2-101', teacher: '数学科学学院' },
  { ...MOCK_COURSES[1], time: '周二 3-4 节', location: '西溪田家炳 205', teacher: '经济学院' },
  { ...MOCK_COURSES[2], time: '周三 6-8 节', location: '玉泉曹光彪西楼', teacher: '计算机学院' },
  { ...MOCK_COURSES[3], time: '周四 1-2 节', location: '紫金港东 1-204', teacher: '管理学院' },
  { id: 'c5', name: '线性代数及其应用', term: '大二春夏学期', type: '公共必修', time: '周五 3-4 节', location: '紫金港西 1-304', teacher: '数学科学学院' },
  { id: 'c10', name: '离散数学', term: '大二春夏学期', type: '专业必修', time: '周一 6-8 节', location: '玉泉教七 301', teacher: '计算机学院' },
  { id: 'c11', name: '计算机网络', term: '大二春夏学期', type: '专业必修', time: '周二 6-8 节', location: '玉泉曹光彪东楼', teacher: '计算机学院' }
];

const OCR_SAMPLE_COURSES = [
  COURSE_LIBRARY[0],
  COURSE_LIBRARY[2],
  COURSE_LIBRARY[4],
  { id: 'c12', name: '大学英语', term: '大二春夏学期', type: '公共必修', time: '周四 6-7 节', location: '紫金港东 6-201', teacher: '外国语学院' },
  { id: 'c14', name: '程序设计专题', term: '大二春夏学期', type: '专业选修', time: '周五 6-8 节', location: '紫金港机房 3', teacher: '计算机学院' }
];

const formatTime = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const parseSavedSchedule = () => {
  try {
    const saved = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.courses)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const Schedule = () => {
  const [boundCourses, setBoundCourses] = useState([]);
  const [bindingMeta, setBindingMeta] = useState(null);
  const [manualCourse, setManualCourse] = useState({ name: '', type: '专业选修' });
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const saved = parseSavedSchedule();
    if (saved) {
      setBoundCourses(saved.courses);
      setBindingMeta(saved.meta);
    }
  }, []);

  const persistSchedule = (courses, source) => {
    const meta = {
      source,
      term: '2026 春夏学期',
      updatedAt: formatTime()
    };
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify({ courses, meta }));
    setBoundCourses(courses);
    setBindingMeta(meta);
  };

  const bindFromAcademicSystem = () => {
    setIsSyncing(true);
    window.setTimeout(() => {
      persistSchedule(COURSE_LIBRARY.slice(0, 5), '教务网一键同步（原型模拟）');
      setIsSyncing(false);
      setToast('课表绑定成功，已按课程生成教材推荐。');
    }, 500);
  };

  const bindFromScreenshot = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    persistSchedule(OCR_SAMPLE_COURSES, `课表截图识别：${file.name}`);
    setToast('已模拟识别课表截图，并完成本地绑定。');
    event.target.value = '';
  };

  const resetSchedule = () => {
    localStorage.removeItem(SCHEDULE_STORAGE_KEY);
    setBoundCourses([]);
    setBindingMeta(null);
    setToast('已解除课表绑定。');
  };

  const addManualCourse = (event) => {
    event.preventDefault();
    const name = manualCourse.name.trim();
    if (!name) return;

    const matchedCourse = COURSE_LIBRARY.find((course) => course.name.includes(name) || name.includes(course.name));
    const nextCourse = matchedCourse || {
      id: `custom-${Date.now()}`,
      name,
      term: bindingMeta?.term || '2026 春夏学期',
      type: manualCourse.type,
      time: '手动补充',
      location: '待确认',
      teacher: '待确认'
    };

    if (boundCourses.some((course) => course.id === nextCourse.id || course.name === nextCourse.name)) {
      setToast('这门课已经在当前课表里了。');
      return;
    }

    persistSchedule([...boundCourses, nextCourse], bindingMeta ? '手动维护课表' : '手动绑定课表');
    setManualCourse({ name: '', type: '专业选修' });
    setToast('已补充课程，并重新计算教材推荐。');
  };

  const removeCourse = (courseId) => {
    const nextCourses = boundCourses.filter((course) => course.id !== courseId);
    if (nextCourses.length === 0) {
      resetSchedule();
      return;
    }
    persistSchedule(nextCourses, '手动维护课表');
    setToast('已移除课程，并更新推荐结果。');
  };

  const scheduleRows = useMemo(() => {
    return boundCourses.map((course) => {
      const matchedBooks = MOCK_BOOKS
        .filter((book) => book.status === 'approved' && book.courseId === course.id)
        .sort((a, b) => b.aiScore - a.aiScore || a.price - b.price);

      return {
        ...course,
        matchedBooks,
        bestBook: matchedBooks[0]
      };
    });
  }, [boundCourses]);

  const summary = useMemo(() => {
    const recommendedBooks = scheduleRows.map((row) => row.bestBook).filter(Boolean);
    const totalPrice = recommendedBooks.reduce((sum, book) => sum + book.price, 0);
    const totalOriginalPrice = recommendedBooks.reduce((sum, book) => sum + book.originalPrice, 0);
    const highPriorityCount = recommendedBooks.filter((book) => book.aiScore >= 90).length;

    return {
      bookCount: recommendedBooks.length,
      totalPrice,
      saved: Math.max(totalOriginalPrice - totalPrice, 0),
      highPriorityCount
    };
  }, [scheduleRows]);

  const addRecommendedToCart = () => {
    const recommendedIds = scheduleRows.map((row) => row.bestBook?.id).filter(Boolean);
    if (recommendedIds.length === 0) {
      setToast('当前课表还没有可加入清单的推荐教材。');
      return;
    }

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    const nextCart = Array.from(new Set([...currentCart, ...recommendedIds]));
    localStorage.setItem('cart', JSON.stringify(nextCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setToast(`已把 ${recommendedIds.length} 本推荐教材加入购书清单。`);
  };

  const isBound = boundCourses.length > 0;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
      <section className="bg-white border border-gray-100 rounded-[32px] shadow-sm p-8 overflow-hidden relative">
        <div className="absolute inset-x-0 top-0 h-1.5 flex">
          <div className="flex-1 bg-google-blue"></div>
          <div className="flex-1 bg-google-red"></div>
          <div className="flex-1 bg-google-yellow"></div>
          <div className="flex-1 bg-google-green"></div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isBound ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                {isBound ? <CheckCircle2 className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
              </span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${isBound ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                {isBound ? 'Schedule Bound' : 'Schedule Binding'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">课表绑定推荐</h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
              先绑定本学期课表，再由系统按课程 ID 匹配二手教材、AI 必要性评分和知识社区资料。当前为前端原型模拟，绑定结果会保存在本地浏览器。
            </p>
          </div>

          {isBound && (
            <div className="grid grid-cols-3 gap-3 min-w-[420px]">
              {[
                ['绑定课程', `${boundCourses.length} 门`],
                ['推荐教材', `${summary.bookCount} 本`],
                ['预计省下', `¥${summary.saved.toFixed(0)}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-gray-50 border border-gray-100 px-5 py-4">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{label}</p>
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-2xl px-5 py-3 text-sm font-bold flex items-center justify-between">
          <span>{toast}</span>
          <button onClick={() => setToast('')} className="p-1 rounded-full hover:bg-blue-100 transition-colors" title="关闭提示">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8 items-start">
        <aside className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-6 sticky top-[112px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-black text-gray-900">我的本学期课表</h2>
              <p className="text-[10px] font-bold text-gray-400 mt-1">{bindingMeta?.term || '尚未绑定'}</p>
            </div>
            {isBound && (
              <button onClick={resetSchedule} className="w-10 h-10 rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors" title="解除绑定">
                <RefreshCw className="w-5 h-5 mx-auto" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={bindFromAcademicSystem}
              disabled={isSyncing}
              className="h-12 rounded-2xl bg-blue-600 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-70 transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              {isSyncing ? '同步中...' : isBound ? '重新同步教务课表' : '教务网一键同步'}
            </button>

            <label className="h-12 rounded-2xl bg-gray-50 border border-gray-100 text-gray-700 text-sm font-black flex items-center justify-center gap-2 hover:bg-white hover:border-blue-100 hover:text-blue-600 transition-colors cursor-pointer">
              <UploadCloud className="w-4 h-4" />
              上传课表截图识别
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={bindFromScreenshot} />
            </label>
          </div>

          {isBound ? (
            <>
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-6">
                <div className="flex items-center gap-2 text-emerald-700 text-xs font-black mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  已完成课表绑定
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  来源：{bindingMeta?.source}<br />
                  更新时间：{bindingMeta?.updatedAt}
                </p>
              </div>

              <div className="flex flex-col gap-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-gray-200">
                {boundCourses.map((course, idx) => (
                  <div key={`${course.id}-${idx}`} className="relative pl-8 group">
                    <div className={`absolute left-[9px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className={`font-bold text-sm truncate ${idx === 0 ? 'text-blue-600' : 'text-gray-800'}`}>{course.name}</h3>
                        <p className="text-[10px] text-gray-400 mt-1">{course.time} / {course.type}</p>
                      </div>
                      <button
                        onClick={() => removeCourse(course.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        title="移除课程"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-3xl bg-gray-50 border border-dashed border-gray-200 p-6 text-center mb-6">
              <Sparkles className="w-9 h-9 text-blue-500 mx-auto mb-3" />
              <h3 className="font-black text-gray-900 mb-2">还没绑定课表</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                绑定后才会按课程生成专属教材推荐。这里先用本地模拟流程展示对接教务网后的效果。
              </p>
            </div>
          )}

          <form onSubmit={addManualCourse} className="mt-7 pt-6 border-t border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">手动补充课程</h3>
            <div className="flex flex-col gap-3">
              <input
                value={manualCourse.name}
                onChange={(event) => setManualCourse((current) => ({ ...current, name: event.target.value }))}
                placeholder="例如：离散数学"
                className="h-11 rounded-2xl bg-gray-50 border border-gray-100 px-4 text-sm font-medium text-gray-800 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
              />
              <select
                value={manualCourse.type}
                onChange={(event) => setManualCourse((current) => ({ ...current, type: event.target.value }))}
                className="h-11 rounded-2xl bg-gray-50 border border-gray-100 px-4 text-sm font-bold text-gray-600 focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all"
              >
                <option>公共必修</option>
                <option>大类必修</option>
                <option>专业必修</option>
                <option>专业选修</option>
              </select>
              <button type="submit" className="h-11 rounded-2xl bg-gray-900 text-white text-sm font-black flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4" />
                补充课程
              </button>
            </div>
          </form>
        </aside>

        <main className="flex flex-col gap-8">
          {!isBound ? (
            <section className="bg-white border border-gray-100 rounded-[32px] shadow-sm p-12 text-center">
              <img src="/taosu.png" alt="桃酥" className="w-28 h-28 object-contain mx-auto mb-6" />
              <h2 className="text-3xl font-black text-gray-900 mb-3">绑定课表后，桃酥才能按课程挑书</h2>
              <p className="text-gray-500 max-w-xl mx-auto leading-relaxed mb-8">
                当前不会假装你已经绑定。点击左侧“教务网一键同步”后，系统会把模拟课表写入本地，并立刻生成课程对应教材推荐。
              </p>
              <button onClick={bindFromAcademicSystem} className="h-12 px-8 rounded-full bg-blue-600 text-white font-black inline-flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <DownloadCloud className="w-4 h-4" />
                立即绑定示例课表
              </button>
            </section>
          ) : (
            <>
              <section className="bg-white border border-gray-100 rounded-[32px] shadow-sm p-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-[0.25em] mb-3">
                    <Sparkles className="w-4 h-4" />
                    Taosu Recommendation
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">已生成本学期购书优先级</h2>
                  <p className="text-sm text-gray-500 mt-2">
                    {summary.highPriorityCount} 本高必要性教材建议优先购买，预计二手价合计 ¥{summary.totalPrice.toFixed(1)}。
                  </p>
                </div>
                <button onClick={addRecommendedToCart} className="h-12 px-7 rounded-2xl bg-gray-900 text-white font-black hover:bg-blue-600 transition-colors">
                  一键加入推荐清单
                </button>
              </section>

              {scheduleRows.map((course) => (
                <section key={course.id} className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-[#f8fafc] px-7 py-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h2 className="font-black text-xl text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        {course.name}
                        <span className="font-bold text-xs text-gray-400">{course.type}</span>
                      </h2>
                      <p className="text-xs text-gray-400 mt-2">
                        {course.time} / {course.location} / {course.teacher}
                      </p>
                    </div>
                    <span className="w-fit text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-black border border-gray-200">
                      共 {course.matchedBooks.length} 款现货
                    </span>
                  </div>

                  <div className="p-7">
                    {course.matchedBooks.length > 0 ? (
                      <div className="flex flex-col gap-5">
                        {course.matchedBooks.map((book) => (
                          <div key={book.id} className="flex flex-col md:flex-row gap-6 border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                            <img src={book.cover} alt={book.title} className="w-24 h-32 object-cover rounded-2xl shadow-sm border border-gray-100 bg-gray-50" />
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black border border-blue-100">
                                  AI 必要性 {book.aiScore}
                                </span>
                                {book.hasNotes && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-black border border-emerald-100">
                                    带学长笔记
                                  </span>
                                )}
                                <span className="text-[10px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-black border border-gray-100">
                                  {book.campus}
                                </span>
                              </div>
                              <h3 className="font-black text-gray-900 text-lg mb-2 truncate">{book.title}</h3>
                              <p className="text-sm text-gray-500 mb-4 leading-relaxed line-clamp-2">{book.aiSummary}</p>
                              <div className="flex flex-wrap gap-2">
                                <span className="text-[10px] bg-rose-50 text-rose-600 px-2.5 py-1 rounded-full font-black border border-rose-100">
                                  当前二手价 ¥{book.price}
                                </span>
                                <span className="text-[10px] bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full font-black border border-gray-100">
                                  原价 ¥{book.originalPrice}
                                </span>
                                <span className="text-[10px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full font-black border border-amber-100">
                                  {book.condition}
                                </span>
                              </div>
                            </div>
                            <div className="flex md:flex-col justify-end items-stretch md:items-end gap-3 md:min-w-[136px]">
                              <Link to={`/book/${book.id}`} className="h-11 px-5 rounded-2xl bg-blue-600 text-white font-black text-sm shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-1 group">
                                查看详情 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <AlertTriangle className="w-11 h-11 text-orange-300 mb-3" />
                        <p className="text-sm font-black text-gray-700">全网暂无同学上架此课程用书</p>
                        <p className="text-xs text-gray-400 mt-2 mb-5">可以登记心愿单，后续由桃酥帮你监控书源。</p>
                        <button className="text-xs font-black text-blue-600 border border-blue-100 px-5 py-2 rounded-full hover:bg-blue-50 transition-colors">
                          点击进行全校悬赏
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              ))}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Schedule;
