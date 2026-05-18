import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, Bot, CheckCircle2, ChevronRight, Cpu, MessageSquareText, Search, Send, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_BOOKS } from '../mockData';

const quickPrompts = [
  {
    label: '这本要买吗',
    question: '数据结构基础这门课需要买教材吗？'
  },
  {
    label: '帮我省钱',
    question: '预算有限，哪些教材可以先借阅？'
  },
  {
    label: '按课表推荐',
    question: '按我的本学期课表给我排一个购书优先级。'
  },
  {
    label: '找带笔记的书',
    question: '帮我优先找带学长笔记、适合期末复习的书。'
  }
];

const SCHEDULE_STORAGE_KEY = 'zookBoundSchedule';

const getTaosuAnswer = (question, strongBooks, cautiousBooks, boundCourses) => {
  const lowerQuestion = question.toLowerCase();
  const matchedBook = MOCK_BOOKS.find((book) =>
    lowerQuestion.includes(book.title.toLowerCase()) ||
    lowerQuestion.includes(book.author.toLowerCase()) ||
    question.includes(book.title.slice(0, 4))
  );

  if (matchedBook) {
    return `桃酥查到《${matchedBook.title}》当前 AI 必要性评分是 ${matchedBook.aiScore} 分。${matchedBook.aiSummary} 参考我的判断：${
      matchedBook.aiScore >= 85
        ? '建议优先加入清单，最好选同校区并带笔记的版本。'
        : matchedBook.aiScore >= 70
          ? '可以先收藏观望，确认授课老师是否强制使用后再买。'
          : '不建议盲买，先借阅或看知识社区资料更稳。'
    }`;
  }

  if (question.includes('省钱') || question.includes('预算') || question.includes('借阅')) {
    const names = cautiousBooks.map((book) => `《${book.title}》`).join('、');
    return `桃酥建议先从低必要性教材省钱。目前 ${names || '评分较低的教材'} 可以先借阅或等同学转手降价；硬课教材优先买带笔记二手本，通常比新书更适合期末。`;
  }

  if (question.includes('课表') || question.includes('优先级')) {
    if (boundCourses.length > 0) {
      const priorityBooks = boundCourses
        .map((course) => {
          const bestBook = MOCK_BOOKS
            .filter((book) => book.status === 'approved' && book.courseId === course.id)
            .sort((a, b) => b.aiScore - a.aiScore || a.price - b.price)[0];
          return bestBook ? { course, book: bestBook } : null;
        })
        .filter(Boolean);

      const courseSummary = boundCourses.map((course) => course.name).join('、');
      const bookSummary = priorityBooks.slice(0, 4).map(({ book }) => `《${book.title}》`).join('、');

      if (priorityBooks.length > 0) {
        return `我已经读取到你绑定的本学期课表：${courseSummary}。按课程硬度和 AI 必要性，桃酥建议优先看 ${bookSummary}。如果预算有限，先买专业必修和 AI 分数 90 以上的书，公共课可以结合知识社区资料再决定。`;
      }

      return `我已经读取到你绑定的本学期课表：${courseSummary}，但当前教材库还没有完全匹配的二手书源。建议先去课表推荐页登记悬赏，桃酥后续可以按课程帮你监控新上架教材。`;
    }

    return `按当前原型课表，桃酥建议优先级是：专业硬课 > 数理基础课 > 公共课 > 可替代资料课。先看 ${strongBooks.slice(0, 3).map((book) => `《${book.title}》`).join('、')}，这些评分高且复用价值更强。`;
  }

  if (question.includes('笔记') || question.includes('期末')) {
    return `桃酥会优先筛带笔记、AI 分高、卖家信誉高的书。你可以先看“强烈推荐区”的教材，再到知识社区找对应课程的复习提纲，把书和资料配套买最划算。`;
  }

  return `桃酥先用当前本地原型数据给你一个判断：看 AI 分数、课程硬度、是否带笔记、校区距离和卖家信誉。等后续接入本地开源大模型后，这里可以把问题发给本地模型，并结合教材库、课表和知识社区做 RAG 回答。`;
};

const AIAnalysis = () => {
  const [boundCourses, setBoundCourses] = useState([]);

  useEffect(() => {
    try {
      const savedSchedule = JSON.parse(localStorage.getItem(SCHEDULE_STORAGE_KEY) || '{}');
      if (Array.isArray(savedSchedule.courses)) {
        setBoundCourses(savedSchedule.courses);
      }
    } catch {
      setBoundCourses([]);
    }
  }, []);

  const strongBooks = useMemo(
    () => MOCK_BOOKS.filter((book) => book.aiScore > 85).sort((a, b) => b.aiScore - a.aiScore),
    []
  );
  const cautiousBooks = useMemo(
    () => MOCK_BOOKS.filter((book) => book.aiScore < 70).sort((a, b) => a.aiScore - b.aiScore),
    []
  );

  const [messages, setMessages] = useState([
    {
      id: 'hello',
      role: 'assistant',
      content: '嗨，我是桃酥。你可以问我某本教材值不值得买，也可以让我按课表、预算或期末复习目标帮你挑书。'
    },
    {
      id: 'sample',
      role: 'assistant',
      content: `今日高分样本是《${strongBooks[0]?.title || '数据结构与算法分析'}》，适合优先关注。`
    }
  ]);
  const [draft, setDraft] = useState('');

  const sourceCards = useMemo(() => ([
    { label: '教材库', value: `${MOCK_BOOKS.length} 本`, tone: 'blue' },
    { label: '课程关联', value: boundCourses.length > 0 ? `${boundCourses.length} 门` : '未绑定', tone: 'emerald' },
    { label: '知识社区', value: '3 份', tone: 'orange' }
  ]), [boundCourses.length]);

  const askTaosu = (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    const answer = getTaosuAnswer(cleanQuestion, strongBooks, cautiousBooks, boundCourses);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: 'user', content: cleanQuestion },
      { id: `assistant-${Date.now()}`, role: 'assistant', content: answer }
    ]);
    setDraft('');
  };

  const submitChat = (event) => {
    event.preventDefault();
    askTaosu(draft);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
      <section className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8 min-h-[720px]">
        <aside className="bg-white border border-gray-100 rounded-[32px] shadow-sm p-7 flex flex-col gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-orange-200 blur-3xl opacity-60 rounded-full"></div>
              <img src="/taosu.png" alt="桃酥" className="relative w-32 h-32 object-contain drop-shadow-xl" />
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest border border-orange-100">Taosu Chat</span>
            <h1 className="mt-3 text-3xl font-black text-gray-900 tracking-tight">桃酥</h1>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">温暖治愈的 AI 知识小助手，陪你发现好书、连接资料和课程经验。</p>
          </div>

          <div className="rounded-3xl bg-gray-50 border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-gray-900">本地模型舱</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">运行模式</span>
                <span className="text-blue-600 font-black">Local LLM</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">连接状态</span>
                <span className="text-amber-600 font-black">原型模拟</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">知识增强</span>
                <span className="text-emerald-600 font-black">RAG Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {sourceCards.map((source) => {
              const tones = {
                blue: 'bg-blue-50 text-blue-700 border-blue-100',
                emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                orange: 'bg-orange-50 text-orange-700 border-orange-100'
              };
              return (
                <div key={source.label} className={`rounded-2xl border px-4 py-3 flex items-center justify-between ${tones[source.tone]}`}>
                  <span className="text-xs font-black">{source.label}</span>
                  <span className="text-sm font-black">{source.value}</span>
                </div>
              );
            })}
          </div>

          <Link to="/community" className="mt-auto h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center gap-2 text-sm font-black hover:bg-blue-600 transition-colors">
            去知识社区 <ChevronRight className="w-4 h-4" />
          </Link>
        </aside>

        <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden flex flex-col">
          <div className="h-20 px-7 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-gray-900">桃酥对话</h2>
                <p className="text-xs font-bold text-gray-400">教材必要性判断 · 课表推荐 · 知识社区检索</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace Ready</span>
            </div>
          </div>

          <div className="flex-1 bg-gray-50/50 p-7 overflow-y-auto">
            <div className="flex flex-col gap-5">
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div key={message.id} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <img src="/taosu.png" alt="桃酥头像" className="w-10 h-10 rounded-2xl bg-white object-contain border border-orange-100 shadow-sm" />
                    )}
                    <div className={`max-w-[78%] rounded-[24px] px-5 py-4 shadow-sm text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-md'
                        : 'bg-white text-gray-700 border border-gray-100 rounded-tl-md'
                    }`}>
                      {message.content}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 bg-white">
            <div className="flex flex-wrap gap-2 mb-4">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt.label}
                  onClick={() => askTaosu(prompt.question)}
                  className="px-4 h-10 rounded-full bg-gray-50 border border-gray-100 text-xs font-black text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                >
                  {prompt.label}
                </button>
              ))}
            </div>

            <form onSubmit={submitChat} className="flex gap-3">
              <div className="flex-1 h-14 bg-gray-50 border border-gray-100 rounded-2xl px-5 flex items-center gap-3 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="问桃酥：这本教材要买吗？"
                  className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 placeholder:text-gray-400"
                />
              </div>
              <button type="submit" className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-emerald-100 rounded-[32px] shadow-sm p-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-emerald-600" />
              <h2 className="text-2xl font-black text-gray-900">强烈推荐区</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black">建议优先买</span>
          </div>

          <div className="flex flex-col gap-4">
            {strongBooks.slice(0, 5).map((book) => (
              <Link to={`/book/${book.id}`} key={book.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                <img src={book.cover} alt={book.title} className="w-14 h-20 object-cover rounded-xl border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 truncate group-hover:text-blue-600">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{book.aiSummary}</p>
                  <p className="mt-3 text-[10px] font-black text-blue-600">查看全部在售 ({book.aiScore}分)</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 self-center group-hover:text-blue-600" />
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-orange-100 rounded-[32px] shadow-sm p-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-black text-gray-900">不建议盲买区</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black">先借阅观望</span>
          </div>

          <div className="flex flex-col gap-4">
            {cautiousBooks.map((book) => (
              <Link to={`/book/${book.id}`} key={book.id} className="flex gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all group">
                <img src={book.cover} alt={book.title} className="w-14 h-20 object-cover rounded-xl border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-gray-900 truncate group-hover:text-blue-600">{book.title}</h3>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{book.aiSummary}</p>
                  <p className="mt-3 text-[10px] font-black text-blue-600">依然前去查看 ({book.aiScore}分)</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 self-center group-hover:text-blue-600" />
              </Link>
            ))}

            <div className="rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 p-5 flex items-start gap-3">
              <MessageSquareText className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-700 leading-relaxed">
                桃酥建议：不确定时先点进详情页看课程评价，再通过消息中心问卖家是否真的上课常用。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          ['优先买', 'AI 分数高、专业硬课、带笔记'],
          ['先观望', '公共课、PPT 依赖高、评分中等'],
          ['可借阅', '评分偏低、替代资料充足']
        ].map(([title, desc]) => (
          <div key={title} className="bg-white border border-gray-100 rounded-[24px] p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default AIAnalysis;
