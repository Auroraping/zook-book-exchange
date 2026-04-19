import { Award, Target, Zap, Gift, HelpCircle } from 'lucide-react';

const Achievements = () => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-gradient-to-br from-[#003F88] to-[#002a66] rounded-2xl p-8 shadow-xl relative overflow-hidden text-white flex flex-col justify-center border border-zju-blue/20">
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                
                <h2 className="text-2xl font-extrabold mb-2 tracking-wide font-serif">荣誉殿堂与积分库</h2>
                <p className="text-blue-200 text-sm mb-8 w-2/3 leading-relaxed">每一个闲置实体的流通都在减少碳排放；每一次考点笔记的分享都在孕育下一个满分。在这里，您的善举将化为校园影响力。</p>
                
                <div className="flex items-end gap-6 bg-white/10 w-fit p-4 flex-wrap rounded-xl backdrop-blur-sm border border-white/10">
                    <div>
                        <p className="text-[10px] text-blue-200 font-bold mb-1">可用流通积分</p>
                        <p className="text-4xl font-black text-yellow-400 font-mono">1,450</p>
                    </div>
                    <button className="bg-yellow-400 text-yellow-900 px-6 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-yellow-300 transition-colors">
                        去兑换奖品
                    </button>
                    <button className="bg-transparent border border-white/30 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-white/10 transition-colors">
                        查收支明细
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2">
                    <Target className="text-zju-blue w-6 h-6"/>
                    <h3 className="font-bold text-gray-800 text-lg">下级段位预测</h3>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded">V4 铂金</span>
                    <span className="font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">V5 钻石</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div className="w-[85%] bg-gradient-to-r from-yellow-400 to-purple-500 h-full rounded-full"></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">距离升段仅差 1 本闲置书籍收发履约。</p>
            </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Award className="text-zju-blue" />
                解锁的校园专属成就
            </h2>
            <div className="grid grid-cols-4 gap-6">
                {[
                    { name: '初入流转', desc: '成功买下第一本二手书', icon: '🌱', active: true },
                    { name: '知识传递者', desc: '成功售出一手珍藏笔记', icon: '📝', active: true },
                    { name: '环保碳卫士', desc: '累计进行 10 次同台面交', icon: '🌍', active: false },
                    { name: '定价先锋', desc: '成功为平台大盘打下全网底价', icon: '🔨', active: false },
                ].map((badge, idx) => (
                    <div key={idx} className={`p-6 rounded-2xl border-2 flex flex-col items-center text-center transition-all ${badge.active ? 'border-yellow-200 bg-yellow-50/30 shadow-sm' : 'border-gray-100 bg-gray-50 grayscale opacity-60'}`}>
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h4 className={`font-bold text-sm mb-1 ${badge.active ? 'text-gray-800' : 'text-gray-500'}`}>{badge.name}</h4>
                        <p className="text-[10px] text-gray-400">{badge.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default Achievements;
