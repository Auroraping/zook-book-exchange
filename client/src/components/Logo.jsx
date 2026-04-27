import React from 'react';

const Logo = ({ className = "h-8", showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 1. 图标部分：logo.png */}
      <img src="/logo.png" alt="zook logo icon" className="h-full w-auto object-contain" />

      {/* 2. 品牌字部分：直接使用用户上传的 zook_text.png */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <div className="relative flex items-center">
              {/* 100% 还原用户设计的字体图像 */}
              <img src="/zook_text.png" alt="zook text logo" className="h-9 w-auto object-contain" />
            </div>

            {/* 视觉分割线 */}
            <div className="h-8 w-[1px] bg-gray-200/80 mx-1"></div>
            
            {/* 中文名称：浙里淘书 */}
            <span className="text-[32px] font-bold text-[#3c4043] tracking-tight whitespace-nowrap leading-none">浙里淘书</span>
          </div>
          
          {/* 副标题：浙大二手书知识流转平台 */}
          <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] mt-[2px] uppercase">浙大二手书知识流转平台</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
