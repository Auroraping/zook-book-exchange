import { useState } from 'react';
import { Camera, ScanBarcode, UploadCloud, Info, BookOpen } from 'lucide-react';

const Publish = () => {
  const [publishMode, setPublishMode] = useState('scan'); // 'scan' | 'manual'
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <UploadCloud className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-4">教材上架成功！</h2>
        <p className="text-gray-500 mb-10 w-2/3 mx-auto">我们已自动将本书的数据加入到了对应专业学科的“求书广场”推荐队列中。如果有同学心仪，您将会立刻收到学弟学妹的留言通知！</p>
        <button onClick={() => window.location.href='/'} className="bg-zju-blue text-white px-8 py-3 rounded-full font-bold hover:bg-zju-hover transition-colors">
          返回主舞台
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* 头部装饰条 */}
      <div className="bg-gradient-to-r from-zju-blue to-[#0050ab] h-2 w-full"></div>
      
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">发布闲置闲书，回转知识价值</h1>
        <p className="text-sm text-gray-500 mb-8">您可以通过直接扫描书背的条形码极其快速地填补所有出版数据，也可手动精确录题。</p>

        <div className="flex gap-4 mb-8 bg-gray-50 p-2 rounded-xl border border-gray-100 w-fit">
          <button 
            onClick={() => setPublishMode('scan')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${publishMode === 'scan' ? 'bg-white shadow-sm text-zju-blue' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <ScanBarcode className="w-4 h-4"/> ISBN 极速扫码
          </button>
          <button 
            onClick={() => setPublishMode('manual')}
            className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${publishMode === 'manual' ? 'bg-white shadow-sm text-zju-blue' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <BookOpen className="w-4 h-4"/> 详尽手工录表
          </button>
        </div>

        {publishMode === 'scan' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-16 flex flex-col items-center justify-center bg-blue-50/30">
            <div className="relative">
               <Camera className="w-16 h-16 text-zju-blue/50 mb-6" />
               <div className="absolute top-0 left-0 w-full h-full border-t-2 border-zju-blue animate-[ping_2s_ease-in-out_infinite]"></div>
            </div>
            <h3 className="font-bold text-gray-700 text-lg mb-2">准备对接摄像头权限</h3>
            <p className="text-sm text-gray-400 max-w-sm text-center mb-8">请将摄像头对准教科书背面的 ISBN 13 位编码，系统将在 2 秒内为您填好所有的出版元数据信息。</p>
            <button onClick={() => setPublishMode('manual')} className="bg-zju-blue text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-zju-hover transition-all">
              模拟扫码成功，载入表单
            </button>
          </div>
        ) : (
          <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); setIsSuccess(true); }}>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">教材全称</label>
                   <input type="text" required defaultValue="离散数学(修订版)" className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-zju-blue focus:outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">匹配浙大开设课程</label>
                   <input type="text" required defaultValue="离散数学及其应用" className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-zju-blue focus:outline-none" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">原封定价</label>
                   <input type="text" defaultValue="59.00" disabled className="w-full border border-gray-100 bg-gray-50 rounded-lg p-3 text-sm text-gray-400" />
                </div>
                <div>
                   <label className="block text-sm font-bold text-zju-blue mb-2">转卖吐血价</label>
                   <input type="number" required placeholder="建议价: 18.00 (三折)" className="w-full border-2 border-zju-blue/30 rounded-lg p-3 text-sm focus:border-zju-blue focus:outline-none text-zju-blue font-bold" />
                </div>
             </div>

             <div className="mt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">书籍补充描述与成色定级</label>
                <div className="flex gap-4 mb-3">
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs cursor-pointer border border-transparent hover:border-zju-blue">没有任何涂画，95成新</span>
                   <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs cursor-pointer border border-transparent hover:border-zju-blue">半个学期前买的，有重点划线</span>
                   <span className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold border border-red-200 cursor-pointer">满分课堂笔记合辑版</span>
                </div>
                <textarea rows="4" className="w-full border border-gray-200 rounded-lg p-4 text-sm focus:border-zju-blue focus:outline-none resize-none" placeholder="在这里详细描述为什么学弟学妹必须要买你的这本书..."></textarea>
             </div>

             <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3 mt-2">
                <Info className="w-5 h-5 text-zju-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  系统默认将您的交易地点限制在<span className="font-bold text-zju-blue">紫金港校区本部</span>周边，一旦达成意向，请务必于校内人多的公共场合进行最终纸质书籍与汇款的交割。
                </p>
             </div>

             <div className="flex justify-end pt-6 border-t border-gray-100">
                <button type="submit" className="bg-zju-blue text-white px-10 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-zju-hover transition-all">
                  确认无误，点我马上挂号！
                </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Publish;
