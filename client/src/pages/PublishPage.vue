<script setup>
import { ref } from 'vue'
import { Camera, UploadCloud, Info, BookOpen, CheckCircle2 } from 'lucide-vue-next'

const publishMode = ref('scan')
const isSuccess = ref(false)

const tags = ['全新未拆封', '有划线笔记', '9成新', '学霸笔记版']
</script>

<template>
  <div v-if="isSuccess" class="max-w-3xl mx-auto google-card p-16 text-center animate-google-in">
    <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 class="w-12 h-12" /></div>
    <h2 class="text-3xl font-medium text-gray-800 mb-4">教材上架成功！</h2>
    <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-8 flex items-center gap-3 justify-center">
      <div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
      <p class="text-sm text-blue-600 font-medium">心愿速配：已成功通知 3 名正在求购本书的同学！</p>
    </div>
    <p class="text-gray-500 mb-12 w-2/3 mx-auto leading-relaxed">我们已自动将本书的数据加入到了对应专业学科的推荐队列中。</p>
    <button @click="$router.push('/')" class="m3-btn-filled !px-10">返回主页</button>
  </div>
  <div v-else class="max-w-4xl mx-auto google-card overflow-hidden flex flex-col animate-google-in">
    <div class="flex h-1.5 w-full">
      <div class="flex-1 bg-blue-600"></div><div class="flex-1 bg-red-500"></div><div class="flex-1 bg-yellow-500"></div><div class="flex-1 bg-green-500"></div>
    </div>
    <div class="p-10">
      <div class="mb-10">
        <h1 class="text-3xl font-medium text-gray-800 mb-2">发布书籍</h1>
        <p class="text-gray-500">上传截图自动识别，或手动精确录入信息。</p>
      </div>
      <div class="flex gap-2 mb-10 bg-gray-100/50 p-1.5 rounded-[20px] w-fit">
        <button @click="publishMode = 'scan'" :class="['px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all', publishMode === 'scan' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800']"><UploadCloud class="w-4 h-4"/> 截图自动识别</button>
        <button @click="publishMode = 'manual'" :class="['px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all', publishMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800']"><BookOpen class="w-4 h-4"/> 手动录入信息</button>
      </div>
      <div v-if="publishMode === 'scan'" class="border-2 border-dashed border-gray-200 rounded-[32px] p-20 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-blue-300 transition-all cursor-pointer group">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500"><Camera class="w-10 h-10" /></div>
        <h3 class="font-medium text-gray-800 text-xl mb-3">上传书籍或购买记录截图</h3>
        <p class="text-sm text-gray-500 max-w-sm text-center mb-10 leading-relaxed">请上传包含书籍信息的截图，系统将利用 AI 自动为您填充图书出版数据。</p>
        <input type="file" id="screenshot-upload" class="hidden" @change="publishMode = 'manual'" />
        <label for="screenshot-upload" class="m3-btn-filled !px-12 !py-4 cursor-pointer">选择文件</label>
      </div>
      <form v-else class="flex flex-col gap-8" @submit.prevent="isSuccess = true">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">教材全称</label><input type="text" required value="离散数学(修订版)" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" /></div>
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">匹配课程</label><input type="text" required value="离散数学及其应用" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" /></div>
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">原封定价</label><input type="text" value="59.00" disabled class="w-full bg-gray-50/50 border-none rounded-2xl h-14 px-6 text-sm text-gray-400" /></div>
          <div class="space-y-2"><label class="text-xs font-bold text-blue-600 uppercase tracking-widest px-1">转卖建议价</label><input type="number" required placeholder="建议价: 18.00" class="w-full bg-blue-50/50 border-2 border-blue-200 rounded-2xl h-14 px-6 text-sm text-blue-600 font-bold focus:bg-white focus:border-blue-600 focus:ring-0 transition-all" /></div>
        </div>
        <div class="space-y-4">
          <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">书籍描述与成色</label>
          <div class="flex flex-wrap gap-3 mb-2"><button v-for="tag in tags" :key="tag" type="button" class="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all">{{ tag }}</button></div>
          <textarea rows="5" class="w-full bg-gray-50 border-none rounded-[24px] p-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none" placeholder="在这里详细描述书籍状况..."></textarea>
        </div>
        <div class="bg-gray-50 p-6 rounded-[24px] flex items-start gap-4">
          <Info class="w-5 h-5 text-blue-600 mt-0.5" />
          <p class="text-xs text-gray-500 leading-relaxed">系统默认将您的交易地点限制在校区周边。为了您的安全，请务必于校内公共场合进行最终交割。</p>
        </div>
        <div class="flex justify-end pt-6"><button type="submit" class="m3-btn-filled !px-12 !py-4">确认发布书籍</button></div>
      </form>
    </div>
  </div>
</template>
