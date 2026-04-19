import { BookMarked, ThumbsUp, Lock, FileText, Search } from 'lucide-react';
import { MOCK_NOTES } from '../mockData';

const Community = () => {
    return (
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
            
            {/* 顶层搜索与宣传带 */}
            <div className="bg-gradient-to-r from-[#003F88] to-[#0050ab] rounded-2xl p-12 text-center text-white relative overflow-hidden shadow-xl shadow-zju-blue/10">
                <div className="absolute top-[-50%] left-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl"></div>
                <h1 className="text-3xl font-extrabold font-serif mb-4 relative z-10">求是知识共创社区</h1>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8 relative z-10 text-sm leading-relaxed">
                    不仅是物理实体的闲置转移，这里汇聚了千万浙大学子沉淀下来的期末真题、学霸随堂笔记与复习思维导图。所有的资料皆可一键获取并自动存入您的数字资产库。
                </p>
                <div className="max-w-xl mx-auto relative z-10 flex">
                    <input type="text" placeholder="搜索特定的课程笔记、历届真题或名词解释..." className="flex-1 h-12 rounded-l-xl px-6 text-gray-800 focus:outline-none" />
                    <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 font-bold rounded-r-xl transition-colors shadow-inner flex items-center gap-2">
                         <Search className="w-5 h-5"/> 挖掘资料
                    </button>
                </div>
            </div>

            {/* 笔记卡片墙 */}
            <div>
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-zju-blue" />
                        本周校园热载榜
                    </h2>
                    <div className="flex gap-4 text-sm font-semibold">
                        <span className="text-zju-blue cursor-pointer border-b-2 border-zju-blue">全部领域</span>
                        <span className="text-gray-400 hover:text-gray-600 cursor-pointer">公共政治基础课</span>
                        <span className="text-gray-400 hover:text-gray-600 cursor-pointer">硬核理工大典</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    {[...MOCK_NOTES, ...MOCK_NOTES].map((note, idx) => (
                        <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer group flex flex-col h-[200px]">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-blue-50 text-zju-blue text-[10px] font-bold px-2 py-1 rounded border border-blue-100 truncate max-w-[120px]">
                                    {note.course}
                                </span>
                                {note.isPaid && (
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded-full border border-orange-200 flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> 使用积分兑换
                                    </span>
                                )}
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-2 group-hover:text-zju-blue transition-colors line-clamp-2 leading-snug">
                                {note.title}
                            </h3>
                            
                            <div className="mt-auto flex justify-between items-center border-t border-gray-50 pt-4">
                                <div className="flex items-center gap-2">
                                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${note.author}`} className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50" />
                                    <span className="text-xs text-gray-500 font-medium truncate max-w-[80px]">{note.author}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-400 text-xs font-bold">
                                    <ThumbsUp className="w-4 h-4" /> {note.likes}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Community;
