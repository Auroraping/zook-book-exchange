import { Activity, BrainCircuit, MessageSquareText, ShieldAlert, BadgeCheck, FileBarChart } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';
import { Link } from 'react-router-dom';

const AIAnalysis = () => {
    return (
        <div className="flex flex-col gap-10">
            {/* AI 算法顶部宣告区 */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 opacity-5 mix-blend-multiply">
                    <BrainCircuit className="w-96 h-96 text-zju-blue" />
                </div>
                <div className="flex gap-16 relative z-10 items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-zju-blue text-white px-3 py-1 rounded shadow-sm text-xs font-bold tracking-wider">CORE FEATURE</span>
                            <h1 className="text-3xl font-extrabold text-gray-800">求书 AI 学习成本分析中枢</h1>
                        </div>
                        <p className="text-gray-500 leading-relaxed mb-8 max-w-xl text-sm">
                            二手教材平台最核心的痛点在于：“我到底需不需要买这本旧书？”<br/><br/>
                            我们调用了深度神经网络模型，抓取分析了教务网往届数万名浙大学长学姐的<strong className="text-zju-blue font-bold">教评数据、BBS吐槽、出卷规律</strong>。最终为你清洗并输出了这套极其直白暴力的购书购买力分析系统。
                        </p>
                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex gap-6 w-fit">
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-zju-blue">4.5 W+</span>
                                <span className="text-[10px] text-gray-500 font-bold">分析过往教评数</span>
                            </div>
                            <div className="w-px bg-blue-200"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-green-600">82 %</span>
                                <span className="text-[10px] text-gray-500 font-bold">闭卷重合度命中</span>
                            </div>
                            <div className="w-px bg-blue-200"></div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-zju-blue">NLP</span>
                                <span className="text-[10px] text-gray-500 font-bold">使用语言模型栈</span>
                            </div>
                        </div>
                    </div>

                    <div className="w-80 h-80 rounded-2xl bg-gradient-to-br from-zju-blue to-[#001f42] p-6 text-white shadow-2xl flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <Activity className="text-blue-300 w-8 h-8" />
                            <span className="text-[10px] font-bold tracking-widest text-blue-300">REAL-TIME CALCULATION</span>
                        </div>
                        <div>
                            <div className="text-6xl font-black mb-2 opacity-90 text-transparent bg-clip-text bg-gradient-to-b from-white to-zju-blue">98</div>
                            <p className="font-bold text-sm text-blue-100">例：数据结构基础 (玉泉)</p>
                            <p className="text-[10px] text-blue-300 mt-2">推荐指数极高，请必须储备教材防止期末挂科危险。</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 分析瀑布与教材对标 */}
            <section className="grid grid-cols-2 gap-8">
                {/* 推荐必买阵营 */}
                <div className="bg-white border-2 border-green-100 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 bg-green-100 text-green-700 px-4 py-2 font-bold text-sm rounded-bl-2xl">建议优先采买储备</div>
                    <div className="flex items-center gap-2 mb-8">
                        <BadgeCheck className="w-6 h-6 text-green-600" />
                        <h2 className="text-xl font-extrabold text-gray-800">强烈推荐区</h2>
                    </div>
                    <div className="flex flex-col gap-6">
                        {MOCK_BOOKS.filter(b => b.aiScore > 85).map(book => (
                            <div key={book.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <img src={book.cover} className="w-16 h-24 object-cover rounded shadow-sm border border-gray-200" />
                                <div className="flex-1 flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-800 mb-2">{book.title}</h4>
                                    <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 leading-relaxed relative">
                                       <div className="absolute -left-1 top-2 w-2 h-2 bg-white border-l border-t border-gray-100 transform -rotate-45"></div>
                                       " {book.aiSummary} "
                                    </div>
                                    <Link to={`/book/${book.id}`} className="mt-2 text-[10px] text-zju-blue font-bold hover:underline self-start">查看全部在售 ({book.aiScore}分)</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 不推荐买阵营 */}
                <div className="bg-white border-2 border-orange-100 rounded-2xl p-8 relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 px-4 py-2 font-bold text-sm rounded-bl-2xl">视情况蹭书/借阅即可</div>
                    <div className="flex items-center gap-2 mb-8">
                        <ShieldAlert className="w-6 h-6 text-orange-600" />
                        <h2 className="text-xl font-extrabold text-gray-800">不建议盲买区</h2>
                    </div>
                    <div className="flex flex-col gap-6">
                         {MOCK_BOOKS.filter(b => b.aiScore < 60).map(book => (
                            <div key={book.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
                                <img src={book.cover} className="w-16 h-24 object-cover rounded shadow-sm border border-gray-200" />
                                <div className="flex-1 flex flex-col justify-center">
                                    <h4 className="font-bold text-gray-800 mb-2">{book.title}</h4>
                                     <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100 leading-relaxed relative">
                                       <div className="absolute -left-1 top-2 w-2 h-2 bg-white border-l border-t border-gray-100 transform -rotate-45"></div>
                                       " {book.aiSummary} "
                                    </div>
                                    <Link to={`/book/${book.id}`} className="mt-2 text-[10px] text-zju-blue font-bold hover:underline self-start">依然前去查看 ({book.aiScore}分)</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AIAnalysis;
