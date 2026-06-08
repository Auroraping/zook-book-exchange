<script setup>
import { ref, onMounted } from 'vue'
import { Camera, UploadCloud, Info, BookOpen, CheckCircle2 } from 'lucide-vue-next'
import { getJson, postJson, uploadFile as uploadApiFile } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const { user, accountId } = useCurrentAccount()
const publishMode = ref('scan')
const isSuccess = ref(false)
const tags = ref([])
const scanFileName = ref('')
const scanPreview = ref('')
const scanFile = ref(null)
const listing = ref({ title: '', courseName: '', author: '', originalPrice: '', price: '', condition: '', description: '', campus: '紫金港校区' })

onMounted(async () => {
  const ui = await getJson('/api/ui')
  tags.value = ui.publishTags || []
})

const useTag = (tag) => {
  listing.value.condition = listing.value.condition ? `${listing.value.condition}, ${tag}` : tag
}

const acceptScan = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  scanFile.value = file
  scanFileName.value = file.name
  if (!listing.value.title) listing.value.title = file.name.replace(/\.[^.]+$/, '')
  const reader = new FileReader()
  reader.onload = () => {
    scanPreview.value = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  publishMode.value = 'manual'
}

const submitListing = async () => {
  let cover = listing.value.cover
  if (scanFile.value) {
    const formData = new FormData()
    formData.append('file', scanFile.value)
    const uploaded = await uploadApiFile('/api/books/cover', formData)
    cover = uploaded.cover
  }
  await postJson('/api/books', { sellerId: accountId.value, sellerName: user.value?.name, ...listing.value, cover, condition: listing.value.condition || listing.value.description })
  isSuccess.value = true
}
</script>

<template>
  <div v-if="isSuccess" class="max-w-3xl mx-auto google-card p-16 text-center animate-google-in">
    <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 class="w-12 h-12" /></div>
    <h2 class="text-3xl font-medium text-gray-800 mb-4">书籍已上架</h2>
    <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 mb-8 flex items-center gap-3 justify-center"><div class="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div><p class="text-sm text-blue-600 font-medium">发布成功后已直接进入购书广场。</p></div>
    <p class="text-gray-500 mb-12 w-2/3 mx-auto leading-relaxed">记录已保存到 SQLite，您可以在个人中心查看上架信息。</p>
    <button @click="$router.push('/')" class="m3-btn-filled !px-10">返回首页</button>
  </div>
  <div v-else class="max-w-4xl mx-auto google-card overflow-hidden flex flex-col animate-google-in">
    <div class="flex h-1.5 w-full"><div class="flex-1 bg-blue-600"></div><div class="flex-1 bg-red-500"></div><div class="flex-1 bg-yellow-500"></div><div class="flex-1 bg-green-500"></div></div>
    <div class="p-10">
      <div class="mb-10"><h1 class="text-3xl font-medium text-gray-800 mb-2">发布书籍</h1><p class="text-gray-500">可以先上传截图生成草稿，再核对书名、价格和成色。</p></div>
      <div class="flex gap-2 mb-10 bg-gray-100/50 p-1.5 rounded-[20px] w-fit"><button @click="publishMode = 'scan'" :class="['px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all', publishMode === 'scan' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800']"><UploadCloud class="w-4 h-4"/> 截图录入</button><button @click="publishMode = 'manual'" :class="['px-8 py-2.5 rounded-[16px] font-medium text-sm flex items-center gap-2 transition-all', publishMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-800']"><BookOpen class="w-4 h-4"/> 手动填写</button></div>
      <div v-if="publishMode === 'scan'" class="border-2 border-dashed border-gray-200 rounded-[32px] p-20 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-blue-300 transition-all group">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500"><Camera class="w-10 h-10" /></div>
        <h3 class="font-medium text-gray-800 text-xl mb-3">上传书籍截图</h3><p class="text-sm text-gray-500 max-w-sm text-center mb-10 leading-relaxed">截图会作为封面预览，提交前请核对书名、价格和成色。</p>
        <input type="file" id="screenshot-upload" accept="image/*" class="hidden" @change="acceptScan" /><label for="screenshot-upload" class="m3-btn-filled !px-12 !py-4 cursor-pointer">选择图片</label>
      </div>
      <form v-else class="flex flex-col gap-8" @submit.prevent="submitListing">
        <p v-if="scanFileName" class="text-xs font-bold text-blue-600">已选择文件：{{ scanFileName }}</p>
        <img v-if="scanPreview" :src="scanPreview" alt="Uploaded cover preview" class="w-28 h-36 object-cover rounded-2xl border border-gray-100 shadow-sm" />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">书名</label><input v-model="listing.title" type="text" required class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" /></div>
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">课程</label><input v-model="listing.courseName" type="text" required class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" /></div>
          <div class="space-y-2"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">作者与原价</label><div class="grid grid-cols-2 gap-3"><input v-model="listing.author" type="text" placeholder="作者" class="bg-gray-50 border-none rounded-2xl h-14 px-5 text-sm" /><input v-model="listing.originalPrice" type="number" min="0" step="0.01" placeholder="原价" class="bg-gray-50 border-none rounded-2xl h-14 px-5 text-sm" /></div></div>
          <div class="space-y-2"><label class="text-xs font-bold text-blue-600 uppercase tracking-widest px-1">转让价</label><input v-model="listing.price" type="number" min="0" step="0.01" required placeholder="18.00" class="w-full bg-blue-50/50 border-2 border-blue-200 rounded-2xl h-14 px-6 text-sm text-blue-600 font-bold focus:bg-white focus:border-blue-600 focus:ring-0 transition-all" /></div>
        </div>
        <div class="space-y-4"><label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">成色说明</label><div class="flex flex-wrap gap-3 mb-2"><button v-for="tag in tags" :key="tag" type="button" @click="useTag(tag)" class="px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-600 hover:text-blue-600 transition-all">{{ tag }}</button></div><textarea v-model="listing.description" rows="5" class="w-full bg-gray-50 border-none rounded-[24px] p-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none" placeholder="请说明划线、笔记、封面情况和建议交付地点..."></textarea></div>
        <div class="bg-gray-50 p-6 rounded-[24px] flex items-start gap-4"><Info class="w-5 h-5 text-blue-600 mt-0.5" /><p class="text-xs text-gray-500 leading-relaxed">交易建议选择校内公共地点。提交后会直接上架，买家可立即发起沟通与交易。</p></div>
        <div class="flex justify-end pt-6"><button type="submit" class="m3-btn-filled !px-12 !py-4">提交发布</button></div>
      </form>
    </div>
  </div>
</template>
