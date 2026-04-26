import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, MessageSquareText } from 'lucide-react';
import { MOCK_BOOKS } from '../mockData';

const Messages = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.pathname === '/notifications' ? 'system' : 'chat'); // 'chat' | 'system'

    useEffect(() => {
        if (location.pathname === '/notifications') {
            setActiveTab('system');
        } else if (location.pathname === '/messages') {
            setActiveTab('chat');
        }
    }, [location.pathname]);

    const [chats] = useState([
        { id: 1, name: '计科王学长', lastMsg: '这本高数我确实笔记拉满了，可以再给你便宜 2 块钱。', time: '10分钟前', unread: 1, book: MOCK_BOOKS[0] },
        { id: 2, name: '管院小张', lastMsg: '还在吗？你要的话我就下楼了，紫金港二餐见。', time: '1小时前', unread: 0, book: MOCK_BOOKS[3] },
    ]);
    const [activeChatId, setActiveChatId] = useState(1);
    const activeChat = chats.find(c => c.id === activeChatId);

    return (
        <div className="max-w-[1200px] h-[calc(100vh-160px)] mx-auto google-card flex overflow-hidden animate-google-in !shadow-none !border-gray-100">
            {/* 左边栏 */}
            <div className="w-[340px] bg-gray-50/50 border-r border-gray-100 flex flex-col">
                <div className="p-5 flex gap-2">
                    <button 
                        onClick={() => setActiveTab('chat')} 
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'chat' ? 'bg-white shadow-google-1 text-google-blue' : 'text-google-gray hover:bg-gray-100'}`}
                    >
                        私信会话
                    </button>
                    <button 
                        onClick={() => setActiveTab('system')} 
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all relative ${activeTab === 'system' ? 'bg-white shadow-google-1 text-google-blue' : 'text-google-gray hover:bg-gray-100'}`}
                    >
                        系统通知
                        {activeTab !== 'system' && <div className="absolute top-2 right-3 w-2 h-2 bg-google-red rounded-full"></div>}
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'chat' && chats.map(chat => (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`px-5 py-4 cursor-pointer transition-all flex gap-4 items-center ${activeChatId === chat.id ? 'bg-white shadow-sm z-10' : 'hover:bg-gray-100/50'}`}>
                            <div className="relative">
                                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`} className="w-12 h-12 rounded-full border border-gray-100 bg-white" />
                                {chat.unread > 0 && <span className="absolute -top-1 -right-1 bg-google-red text-white text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold border-2 border-white">{chat.unread}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-medium text-google-on-surface text-sm truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-google-gray">{chat.time}</span>
                                </div>
                                <p className="text-xs text-google-gray truncate">{chat.lastMsg}</p>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'system' && (
                        <div className="p-6 flex flex-col gap-4">
                             <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm relative overflow-hidden group hover:shadow-google-2 transition-all">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-google-red"></div>
                                 <h4 className="font-medium text-google-on-surface text-sm mb-1">心仪教材降价</h4>
                                 <p className="text-xs text-google-gray leading-relaxed">您求购的《离散数学》刚刚有同学大幅降价上架，快去看看！</p>
                             </div>
                             <div className="bg-white border border-gray-100 rounded-[20px] p-5 shadow-sm relative overflow-hidden group hover:shadow-google-2 transition-all">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-google-green"></div>
                                 <h4 className="font-medium text-google-on-surface text-sm mb-1">交易成功</h4>
                                 <p className="text-xs text-google-gray leading-relaxed">系统已确认买家签收了您的书籍。</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 右边内容区 */}
            <div className="flex-1 flex flex-col bg-white">
                {activeTab === 'chat' && activeChat ? (
                    <>
                        <div className="h-[72px] px-8 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <h3 className="font-medium text-lg text-google-on-surface">{activeChat.name}</h3>
                                <span className="flex items-center gap-1.5 text-[10px] text-google-green font-medium bg-google-green/5 px-2.5 py-1 rounded-full">
                                    <div className="w-1.5 h-1.5 bg-google-green rounded-full animate-pulse"></div>
                                    在线
                                </span>
                            </div>
                        </div>

                        <div className="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
                            {/* 商品卡片 */}
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
                                <textarea className="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm focus:bg-white focus:ring-2 focus:ring-google-blue/20 transition-all resize-none h-24" placeholder="发送消息..."></textarea>
                                <button className="w-14 h-24 bg-google-blue rounded-2xl flex items-center justify-center text-white hover:shadow-google-2 transition-all active:scale-95">
                                    <Send className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-200 flex-col gap-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                            <MessageSquareText className="w-10 h-10 opacity-20" />
                        </div>
                        <span className="text-sm font-medium tracking-wide">请选择一个对话开始交流</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
