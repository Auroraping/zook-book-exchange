import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Send, Image as ImageIcon, CheckCheck, MessageSquareText } from 'lucide-react';
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
        <div className="max-w-[1200px] h-[calc(100vh-140px)] mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm flex overflow-hidden">
            {/* 左边栏列表库 */}
            <div className="w-[320px] bg-[#f8fafc] border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex gap-1">
                    <button onClick={() => setActiveTab('chat')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${activeTab === 'chat' ? 'bg-white shadow text-zju-blue' : 'text-gray-500 hover:bg-gray-100'}`}>私信交易谈价</button>
                    <button onClick={() => setActiveTab('system')} className={`flex-1 py-2 rounded-md font-bold text-sm transition-all relative ${activeTab === 'system' ? 'bg-white shadow text-zju-blue' : 'text-gray-500 hover:bg-gray-100'}`}>
                        系统通知库 <div className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full"></div>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'chat' && chats.map(chat => (
                        <div key={chat.id} onClick={() => setActiveChatId(chat.id)} className={`p-4 border-b border-gray-100 cursor-pointer transition-colors flex gap-4 items-center ${activeChatId === chat.id ? 'bg-blue-50/50' : 'hover:bg-gray-100'}`}>
                            <div className="relative">
                                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${chat.name}`} className="w-12 h-12 rounded-full border border-gray-200 bg-white" />
                                {chat.unread > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{chat.unread}</span>}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{chat.name}</h4>
                                    <span className="text-[10px] text-gray-400">{chat.time}</span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{chat.lastMsg}</p>
                            </div>
                        </div>
                    ))}

                    {activeTab === 'system' && (
                        <div className="p-6 flex flex-col gap-4">
                             <div className="bg-white border border-red-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                                 <h4 className="font-bold text-gray-800 text-sm mb-1">心仪教材降价大礼</h4>
                                 <p className="text-xs text-gray-500">您求购的《现代控制理论》刚刚有玉泉本部的学长大幅降价上架（-¥12.0），快去看看！</p>
                             </div>
                             <div className="bg-white border border-green-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                                 <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                                 <h4 className="font-bold text-gray-800 text-sm mb-1">交易履约成功</h4>
                                 <p className="text-xs text-gray-500">系统已确认买家当面签收了您的《管理学原理》。</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 右边内容区会话实体 */}
            <div className="flex-1 flex flex-col bg-white">
                {activeTab === 'chat' && activeChat ? (
                    <>
                        <div className="h-[72px] border-b border-gray-100 flex items-center px-6 justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg text-gray-800">{activeChat.name}</h3>
                                <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded border border-green-100">对方在线</span>
                            </div>
                            <span className="text-xs text-gray-400 flex items-center gap-1 cursor-pointer hover:text-red-500 transition-colors">举报拉黑</span>
                        </div>

                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 flex flex-col gap-4">
                            {/* 商品卡片引用插入 */}
                            <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 w-[400px] mb-4 shadow-sm self-center">
                                <img src={activeChat.book.cover} className="w-12 h-16 object-cover border border-gray-100 rounded" />
                                <div className="flex-1">
                                    <h5 className="font-bold text-sm text-gray-800 truncate mb-1">{activeChat.book.title}</h5>
                                    <div className="text-xs text-gray-400 break-all mb-2">对方正在跟您聊这件商品</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-red-500 font-bold text-sm">¥{activeChat.book.price}</span>
                                        <button className="bg-zju-blue text-white text-[10px] px-3 py-1 rounded font-bold shadow hover:bg-zju-hover">直接付款拍下</button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 w-4/5">
                                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.name}`} className="w-8 h-8 rounded-full border border-gray-200 bg-white flex-shrink-0" />
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-700 shadow-sm">
                                    我已经把重点题目都勾在旁边了。如果不考研的话，这个书基本当字典查。
                                </div>
                            </div>
                            <div className="flex items-start justify-end gap-3 w-4/5 self-end">
                                <div className="bg-gradient-to-r from-zju-blue to-[#0050ab] text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm">
                                    太感谢了学长！我现在在西区食堂，方便当面买吗？
                                </div>
                                <img src="/avatar_user_1776602211333.png" className="w-8 h-8 rounded-full border border-zju-blue flex-shrink-0 bg-white object-cover" />
                            </div>
                            <div className="flex items-start gap-3 w-4/5">
                                <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${activeChat.name}`} className="w-8 h-8 rounded-full border border-gray-200 bg-white flex-shrink-0" />
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-sm text-sm text-gray-700 shadow-sm">
                                    可以啊，这本高数我确实笔记拉满了，可以再给你便宜 2 块钱。
                                </div>
                            </div>
                        </div>

                        <div className="h-[140px] border-t border-gray-100 bg-white p-4 flex flex-col shrink-0">
                            <div className="flex gap-2 mb-2">
                                <button className="p-2 text-gray-400 hover:text-zju-blue hover:bg-gray-50 rounded transition-colors"><ImageIcon className="w-5 h-5"/></button>
                            </div>
                            <div className="flex gap-4">
                                <textarea className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-zju-blue focus:bg-white transition-colors" placeholder="在这里发送跟学长/卖家的聊天消息..."></textarea>
                                <button className="w-14 bg-zju-blue rounded-lg flex items-center justify-center text-white hover:bg-zju-hover shadow-md transition-colors">
                                    <Send className="w-5 h-5 ml-[-2px] mt-[2px]" />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-4">
                        <MessageSquareText className="w-20 h-20 opacity-20" />
                        <span>请在左侧选择消息进行读取</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
