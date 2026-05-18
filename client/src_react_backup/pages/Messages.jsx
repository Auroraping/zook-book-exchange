import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, Bell, CheckCircle2, Tag } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const systemNotifications = [
    {
        id: 'wish',
        title: '心仪教材降价',
        content: '你求购的《离散数学》刚刚有同学大幅降价上架，建议尽快查看。',
        tone: 'red',
        time: '刚刚'
    },
    {
        id: 'order',
        title: '交易成功',
        content: '系统已确认买家签收了你的书籍，本次流转记录已计入信誉评分。',
        tone: 'green',
        time: '20分钟前'
    }
];

const Messages = () => {
    const location = useLocation();
    const [chats] = useState([
        { id: 'system', type: 'system', name: '消息通知', lastMsg: '心仪教材降价、订单动态和社区公告都在这里。', time: '刚刚', unread: 2 },
        { id: 1, type: 'chat', name: '计科王学长', lastMsg: '这本高数我确实笔记拉满了，可以再给你便宜 2 块钱。', time: '10分钟前', unread: 1, book: MOCK_BOOKS[0] },
        { id: 2, type: 'chat', name: '管院小张', lastMsg: '还在吗？你要的话我就下楼了，紫金港二餐见。', time: '1小时前', unread: 0, book: MOCK_BOOKS[3] },
    ]);
    const [activeChatId, setActiveChatId] = useState(location.pathname === '/notifications' ? 'system' : 1);

    useEffect(() => {
        if (location.pathname === '/notifications') {
            setActiveChatId('system');
        }
    }, [location.pathname]);

    const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
    const isSystemChat = activeChat.type === 'system';

    return (
        <div className="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
            <div className="w-[340px] bg-gray-50/50 border-r border-gray-100 flex flex-col">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-black text-gray-900">消息通知</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chats & Updates</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {chats.map(chat => {
                        const isActive = activeChatId === chat.id;
                        return (
                            <button
                                key={chat.id}
                                onClick={() => setActiveChatId(chat.id)}
                                className={`w-full text-left px-5 py-4 cursor-pointer transition-all flex gap-4 items-center border-b border-gray-100/70 ${isActive ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50'}`}
                            >
                                <div className="relative shrink-0">
                                    {chat.type === 'system' ? (
                                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                                            <Bell className="w-6 h-6" />
                                        </div>
                                    ) : (
                                        <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`} className="w-12 h-12 rounded-full border border-gray-100 bg-white" />
                                    )}
                                    {chat.unread > 0 && <span className="absolute -top-1 -right-1 bg-google-red text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">{chat.unread}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-medium text-google-on-surface text-sm truncate">{chat.name}</h4>
                                        <span className="text-[10px] text-google-gray">{chat.time}</span>
                                    </div>
                                    <p className="text-xs text-google-gray truncate">{chat.lastMsg}</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                <div className="h-[72px] px-8 flex items-center justify-between border-b border-gray-50">
                    <div className="flex items-center gap-4">
                        <h3 className="font-medium text-lg text-google-on-surface">{activeChat.name}</h3>
                        <span className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full ${isSystemChat ? 'text-blue-600 bg-blue-50' : 'text-google-green bg-google-green/5'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${isSystemChat ? 'bg-blue-600' : 'bg-google-green animate-pulse'}`}></div>
                            {isSystemChat ? '消息同步' : '在线'}
                        </span>
                    </div>
                </div>

                {isSystemChat ? (
                    <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
                        <div className="max-w-xl mx-auto w-full bg-white border border-gray-100 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900">系统通知已合并到会话</h4>
                                    <p className="text-xs text-gray-400 font-bold">订单、心愿单、社区公告都会像聊天一样推送。</p>
                                </div>
                            </div>
                        </div>

                        {systemNotifications.map((notice) => {
                            const tone = notice.tone === 'green'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100';
                            const Icon = notice.tone === 'green' ? CheckCircle2 : Tag;

                            return (
                                <div key={notice.id} className="flex items-start gap-4 max-w-[85%]">
                                    <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${tone}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="bg-white border border-gray-100 p-5 rounded-2xl rounded-tl-none text-sm text-google-on-surface shadow-sm leading-relaxed">
                                        <div className="flex items-center justify-between gap-8 mb-2">
                                            <h4 className="font-black text-gray-900">{notice.title}</h4>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">{notice.time}</span>
                                        </div>
                                        <p className="text-gray-500">{notice.content}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <>
                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
                            <div className="bg-white google-card !p-4 flex gap-4 w-full max-w-md mx-auto mb-4 border-gray-100 !rounded-2xl">
                                <img src={activeChat.book.cover} className="w-14 h-20 object-cover rounded-lg shadow-sm" />
                                <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-sm text-google-on-surface truncate mb-1">{activeChat.book.title}</h5>
                                    <div className="text-[11px] text-google-gray mb-3 italic">正在协商此商品</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-google-red font-medium text-lg">¥{activeChat.book.price}</span>
                                        <button className="m3-btn-filled !px-4 !py-1.5 !text-[11px] shadow-google-1">立即支付</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 max-w-[85%]">
                                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.name}`} className="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm" />
                                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-google-on-surface shadow-sm leading-relaxed">
                                    我已经把重点题目都勾在旁边了。如果不考研的话，这个书基本当字典查。
                                </div>
                            </div>

                            <div className="flex items-start justify-end gap-4 max-w-[85%] self-end">
                                <div className="bg-google-blue text-white p-4 rounded-2xl rounded-tr-none text-sm shadow-google-1 leading-relaxed">
                                    太感谢了学长！我现在在西区食堂，方便当面买吗？
                                </div>
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" className="w-9 h-9 rounded-full border-2 border-white shadow-google-1 object-cover bg-white" />
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-50 flex flex-col gap-4">
                            <div className="flex gap-2">
                                <button className="p-2 text-google-gray hover:text-google-blue hover:bg-gray-100 rounded-xl transition-all"><ImageIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="flex gap-4">
                                <textarea className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-google-blue/20 transition-all resize-none h-24" placeholder="发送消息..."></textarea>
                                <button className="w-14 h-24 bg-google-blue rounded-2xl flex items-center justify-center text-white hover:shadow-google-2 transition-all active:scale-95">
                                    <Send className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Messages;
