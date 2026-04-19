import { Link } from 'react-router-dom';
import { Package, Heart, BookMarked, Award, CreditCard, ChevronRight, Settings, ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

const Profile = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
     return (
        <div className="max-w-[1000px] mx-auto py-12 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Lock className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-2">欢迎来到求书个人中心</h2>
            <p className="text-gray-500 mb-8 max-w-md">登录后即可查看您的买卖订单、学期省钱指数以及您收藏的心仪书籍。</p>
            <Link to="/login" className="bg-zju-blue text-white px-12 py-3 rounded-2xl font-bold shadow-xl shadow-zju-blue/20 hover:shadow-zju-blue/40 transition-all hover:-translate-y-1">
                立即极速登录
            </Link>
        </div>
     );
  }
  return (
    <div className="max-w-[1000px] mx-auto flex gap-8">
        {/* 左侧资产菜单 */}
        <div className="w-[280px] shrink-0 flex flex-col gap-6">
             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center">
                 <div className="relative mb-4">
                <img src="/user_avatar.png" className="w-20 h-20 rounded-full border-4 border-zju-light shadow-md bg-white object-cover" />
                     <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                         <ShieldCheck className="w-4 h-4 text-green-500" />
                     </div>
                 </div>
                 <h2 className="text-xl font-extrabold text-gray-800 mb-1">张同学</h2>
                 <p className="text-xs text-gray-400 mb-4 tracking-widest">学号: 320010XXXX</p>
                 <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100/50 rounded-lg p-3 text-center">
                     <span className="text-[10px] text-yellow-600 font-bold bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200 block mb-1 w-fit mx-auto">V4 铂金买家</span>
                     <div className="flex items-center justify-between mt-2">
                         <span className="text-xs text-gray-500">成长值</span>
                         <span className="text-xs font-bold text-yellow-600">850 / 1000</span>
                     </div>
                     <div className="w-full bg-yellow-200/50 h-1.5 rounded-full mt-1.5 overflow-hidden">
                         <div className="bg-gradient-to-r from-yellow-400 to-orange-400 w-[85%] h-full rounded-full"></div>
                     </div>
                 </div>
             </div>

             <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
                 <Link to="/orders" className="flex items-center justify-between p-3 rounded-xl hover:bg-zju-light/50 transition-colors group">
                     <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 group-hover:text-zju-blue">
                         <Package className="w-5 h-5 text-gray-400 group-hover:text-zju-blue transition-colors" /> 我的买卖订单
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                 </Link>
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zju-light/50 transition-colors group cursor-pointer">
                     <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 group-hover:text-zju-blue">
                         <Heart className="w-5 h-5 text-gray-400 group-hover:text-zju-blue transition-colors" /> 我收藏的心仪书籍
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zju-light/50 transition-colors group cursor-pointer">
                     <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 group-hover:text-zju-blue">
                         <BookMarked className="w-5 h-5 text-gray-400 group-hover:text-zju-blue transition-colors" /> 我的课表与专业
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                 </div>
                 <div className="h-px w-full bg-gray-100 my-2"></div>
                 <Link to="/achievements" className="flex items-center justify-between p-3 rounded-xl hover:bg-zju-light/50 transition-colors group">
                     <div className="flex items-center gap-3 text-sm font-semibold text-gray-700 group-hover:text-zju-blue">
                         <Award className="w-5 h-5 text-gray-400 group-hover:text-zju-blue transition-colors" /> 成长勋章与积分
                     </div>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                 </Link>
             </div>
        </div>

        {/* 右侧宽体信息面板 */}
        <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-2xl font-extrabold text-gray-800">校园资产与管理枢纽</h1>

            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between hover:-translate-y-1 transition-transform cursor-pointer">
                    <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">学期总省下金额</p>
                        <p className="text-2xl font-black text-gray-800">¥ 1245.5</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-zju-blue flex items-center justify-center">
                        <CreditCard className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between hover:-translate-y-1 transition-transform cursor-pointer">
                    <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">完成的流转交易</p>
                        <p className="text-2xl font-black text-gray-800">9 <span className="text-sm font-normal text-gray-400">单</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <Package className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-between hover:-translate-y-1 transition-transform cursor-pointer">
                    <div>
                        <p className="text-xs text-gray-400 font-bold mb-1">我的笔记被下载</p>
                        <p className="text-2xl font-black text-gray-800">128 <span className="text-sm font-normal text-gray-400">次</span></p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                        <BookMarked className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-lg">最近进行的履约</h3>
                    <Link to="/orders" className="text-xs font-bold text-zju-blue hover:underline">查看全部订单</Link>
                </div>
                <div className="p-6 flex flex-col gap-4">
                    {/* 假数据渲染单行状态 */}
                     <div className="flex items-center gap-6 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                         <img src="/book_economics.png" className="w-10 h-14 object-cover rounded shadow-sm" />
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-sm mb-1">微观经济学：现代观点</h4>
                            <p className="text-[10px] text-gray-400">西溪校区面交单 | 交易编号: #TRD-08221</p>
                        </div>
                        <div className="text-right">
                           <div className="text-lg font-black text-red-500 mb-1">¥ 45.00</div>
                           <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-bold border border-yellow-200">对方正在赶往当面交付</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;
