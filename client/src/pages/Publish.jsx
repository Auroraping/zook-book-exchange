import { useState } from 'react';
import { Camera, ScanBarcode, UploadCloud, Info, BookOpen, CheckCircle2 } from 'lucide-react';

const Publish = () => {
  const [publishMode, setPublishMode] = useState('scan'); // 'scan' | 'manual'
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto google-card p-16 text-center animate-google-in">
        <div className="w-24 h-24 bg-google-green/10 text-google-green rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-medium text-google-on-surface mb-4">教材上架成功！</h2>
        <div className="bg-blue-50/50 border border-google-blue/10 rounded-2xl p-4 mb-8 flex items-center gap-3 justify-center">
          <div className="w-2 h-2 bg-google-blue rounded-full animate-pulse"></div>
          <p className="text-sm text-google-blue font-medium">心愿速配：已成功通知 3 名正在求购本书的同学！</p>
        </div>
        <p className="text-google-gray mb-12 w-2/3 mx-auto leading-relaxed">我们已自动将本书的数据加入到了对应专业学科的推荐队列中。如果有同学感兴趣，您将会立刻收到他们的咨询消息！</p>
        <button onClick={() => window.location.href='/'} className="m3-btn-filled !px-10">
          返回主页
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto google-card overflow-hidden flex flex-col animate-google-in">
      {/* 头部装饰条 - Google 多彩条 */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1 bg-google-blue"></div>
        <div className="flex-1 bg-google-red"></div>
        <div className="flex-1 bg-google-yellow"></div>
        <div className="flex-1 bg-google-green"></div>
      </div>
      
      <div className="p-10">
        <div className="mb-10">
            <h1 className="text-3xl font-medium text-google-on-surface mb-2">发布书籍</h1>
            <p className="text-google-gray">上传截图自动识别，或手动精确录入信息。</p>
        </div>

        <div className="flex gap-2 mb-10 bg-gray-100/50 p-1.5 rounded-[20px] w-fit">
          <button 
            onClick={() => setPublishMode('scan')}
            className={`px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all ${publishMode === 'scan' ? 'bg-white shadow-google-1 text-google-blue' : 'text-google-gray hover:text-google-on-surface'}`}
          >
            <UploadCloud className="w-4 h-4"/> 截图自动识别
          </button>
          <button 
            onClick={() => setPublishMode('manual')}
            className={`px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all ${publishMode === 'manual' ? 'bg-white shadow-google-1 text-google-blue' : 'text-google-gray hover:text-google-on-surface'}`}
          >
            <BookOpen className="w-4 h-4"/> 手动录入信息
          </button>
        </div>

        {publishMode === 'scan' ? (
          <div className="border-2 border-dashed border-gray-200 rounded-[32px] p-20 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-google-blue/30 transition-all cursor-pointer group">
            <div className="w-20 h-20 bg-google-blue/5 text-google-blue rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
               <Camera className="w-10 h-10" />
            </div>
            <h3 className="font-medium text-google-on-surface text-xl mb-3">上传书籍或购买记录截图</h3>
            <p className="text-sm text-google-gray max-w-sm text-center mb-10 leading-relaxed">请上传包含书籍信息的截图，系统将利用 AI 自动为您填充图书出版数据。</p>
            <input type="file" id="screenshot-upload" className="hidden" onChange={() => setPublishMode('manual')} />
            <label htmlFor="screenshot-upload" className="m3-btn-filled !px-12 !py-4 cursor-pointer shadow-google-2">
              选择文件
            </label>
          </div>
        ) : (
          <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); setIsSuccess(true); }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-xs font-bold text-google-gray uppercase tracking-widest px-1">教材全称</label>
                   <input type="text" required defaultValue="离散数学(修订版)" className="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-google-on-surface focus:bg-white focus:ring-2 focus:ring-google-blue/20 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-google-gray uppercase tracking-widest px-1">匹配课程</label>
                   <input type="text" required defaultValue="离散数学及其应用" className="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-google-on-surface focus:bg-white focus:ring-2 focus:ring-google-blue/20 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-google-gray uppercase tracking-widest px-1">原封定价</label>
                   <input type="text" defaultValue="59.00" disabled className="w-full bg-gray-50/50 border-none rounded-2xl h-14 px-6 text-sm text-gray-400" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-google-blue uppercase tracking-widest px-1">转卖建议价</label>
                   <input type="number" required placeholder="建议价: 18.00" className="w-full bg-blue-50/50 border-2 border-google-blue/20 rounded-2xl h-14 px-6 text-sm text-google-blue font-bold focus:bg-white focus:border-google-blue focus:ring-0 transition-all" />
                </div>
             </div>

             <div className="space-y-4">
                <label className="text-xs font-bold text-google-gray uppercase tracking-widest px-1">书籍描述与成色</label>
                <div className="flex flex-wrap gap-3 mb-2">
                   {['全新未拆封', '有划线笔记', '9成新', '学霸笔记版'].map(tag => (
                     <button type="button" key={tag} className="google-chip hover:border-google-blue hover:text-google-blue">{tag}</button>
                   ))}
                </div>
                <textarea rows="5" className="w-full bg-gray-50 border-none rounded-[24px] p-6 text-sm text-google-on-surface focus:bg-white focus:ring-2 focus:ring-google-blue/20 transition-all resize-none" placeholder="在这里详细描述书籍状况..."></textarea>
             </div>

             <div className="bg-m3-surface-container-high/50 p-6 rounded-[24px] flex items-start gap-4">
                <Info className="w-5 h-5 text-google-blue mt-0.5" />
                <p className="text-xs text-google-gray leading-relaxed">
                  系统默认将您的交易地点限制在校区周边。为了您的安全，请务必于校内公共场合进行最终交割。
                </p>
             </div>

             <div className="flex justify-end pt-6">
                <button type="submit" className="m3-btn-filled !px-12 !py-4 shadow-google-3">
                  确认发布书籍
                </button>
             </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Publish;
