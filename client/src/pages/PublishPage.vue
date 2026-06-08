<script setup>
import { computed, ref } from 'vue'
import { CheckCircle2, ImagePlus, Info, Loader2, X } from 'lucide-vue-next'
import { postJson, uploadFile as uploadApiFile } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const { user, accountId } = useCurrentAccount()
const isSuccess = ref(false)
const submitting = ref(false)
const error = ref('')
const imageFiles = ref([])
const imagePreviews = ref([])
const listing = ref({
  title: '',
  courseName: '',
  author: '',
  originalPrice: '',
  price: '',
  condition: '',
  description: '',
  campus: '紫金港校区'
})

const canSubmit = computed(() => {
  return imageFiles.value.length > 0 && listing.value.title.trim() && listing.value.price !== '' && !submitting.value
})

const acceptImages = (event) => {
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith('image/'))
  if (!files.length) return
  imageFiles.value = [...imageFiles.value, ...files].slice(0, 6)
  imagePreviews.value.forEach((url) => URL.revokeObjectURL(url))
  imagePreviews.value = imageFiles.value.map((file) => URL.createObjectURL(file))
  event.target.value = ''
}

const removeImage = (index) => {
  URL.revokeObjectURL(imagePreviews.value[index])
  imageFiles.value.splice(index, 1)
  imagePreviews.value.splice(index, 1)
}

const submitListing = async () => {
  if (!canSubmit.value) {
    error.value = '请至少上传一张图片，并填写书名和价格'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    const formData = new FormData()
    imageFiles.value.forEach((file) => formData.append('files', file))
    const uploaded = await uploadApiFile('/api/books/cover', formData)
    await postJson('/api/books', {
      sellerId: accountId.value,
      sellerName: user.value?.name,
      ...listing.value,
      images: uploaded.images,
      cover: uploaded.cover,
      condition: listing.value.condition || listing.value.description
    })
    isSuccess.value = true
  } catch (err) {
    error.value = err.message || '发布失败，请检查后端服务后重试'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div v-if="isSuccess" class="max-w-3xl mx-auto google-card p-16 text-center animate-google-in">
    <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
      <CheckCircle2 class="w-12 h-12" />
    </div>
    <h2 class="text-3xl font-medium text-gray-800 mb-4">书籍已上架</h2>
    <p class="text-gray-500 mb-12 w-2/3 mx-auto leading-relaxed">记录已保存到 SQLite，买家会通过聊天发起交易。</p>
    <button @click="$router.push('/books')" class="m3-btn-filled !px-10">查看广场</button>
  </div>

  <form v-else class="max-w-5xl mx-auto google-card overflow-hidden animate-google-in" @submit.prevent="submitListing">
    <div class="flex h-1.5 w-full">
      <div class="flex-1 bg-blue-600"></div>
      <div class="flex-1 bg-red-500"></div>
      <div class="flex-1 bg-yellow-500"></div>
      <div class="flex-1 bg-green-500"></div>
    </div>
    <div class="p-10 flex flex-col gap-8">
      <div>
        <h1 class="text-3xl font-medium text-gray-800 mb-2">发布书籍</h1>
        <p class="text-gray-500">图片、书名和价格为必填项，发布后直接上架，并绑定当前邮箱主账号。</p>
      </div>

      <section class="grid md:grid-cols-[320px_1fr] gap-8">
        <div class="space-y-4">
          <label class="border-2 border-dashed border-gray-200 rounded-[28px] min-h-[280px] p-8 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-white hover:border-blue-300 transition-all cursor-pointer">
            <input type="file" accept="image/*" multiple class="hidden" @change="acceptImages" />
            <ImagePlus class="w-12 h-12 text-blue-600 mb-4" />
            <span class="text-sm font-black text-gray-800">上传书籍实拍图片</span>
            <span class="text-xs text-gray-400 mt-2 text-center leading-relaxed">至少 1 张，最多 6 张；详情页会支持展开多图查看。</span>
          </label>
          <div v-if="imagePreviews.length" class="grid grid-cols-3 gap-3">
            <div v-for="(url, index) in imagePreviews" :key="url" class="relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50">
              <img :src="url" class="w-full h-full object-cover" />
              <button type="button" @click="removeImage(index)" class="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2 md:col-span-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">书名 *</label>
            <input v-model="listing.title" type="text" required class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">转让价 *</label>
            <input v-model="listing.price" type="number" min="0" step="0.01" required placeholder="18.00" class="w-full bg-blue-50/50 border-2 border-blue-200 rounded-2xl h-14 px-6 text-sm text-blue-600 font-bold focus:bg-white focus:border-blue-600 focus:ring-0 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">原价</label>
            <input v-model="listing.originalPrice" type="number" min="0" step="0.01" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">课程</label>
            <input v-model="listing.courseName" type="text" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">作者/版本</label>
            <input v-model="listing.author" type="text" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">成色 *</label>
            <input v-model="listing.condition" type="text" required placeholder="九成新、有少量划线" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all" />
          </div>
          <div class="space-y-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">校区</label>
            <select v-model="listing.campus" class="w-full bg-gray-50 border-none rounded-2xl h-14 px-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all">
              <option>紫金港校区</option>
              <option>玉泉校区</option>
              <option>西溪校区</option>
              <option>华家池校区</option>
            </select>
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="text-xs font-bold text-gray-500 uppercase tracking-widest px-1">补充说明</label>
            <textarea v-model="listing.description" rows="5" class="w-full bg-gray-50 border-none rounded-[24px] p-6 text-sm text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none" placeholder="说明划线、笔记、封面情况和建议交付地点..."></textarea>
          </div>
        </div>
      </section>

      <div class="bg-gray-50 p-6 rounded-[24px] flex items-start gap-4">
        <Info class="w-5 h-5 text-blue-600 mt-0.5" />
        <p class="text-xs text-gray-500 leading-relaxed">当前发布者：{{ user?.email || user?.username || accountId }}。交易不走平台支付，买卖双方在聊天中互发收付款码并约定寝室信箱或校内交付方式。</p>
      </div>
      <p v-if="error" class="text-sm font-bold text-red-500">{{ error }}</p>
      <div class="flex justify-end pt-2">
        <button type="submit" :disabled="!canSubmit" class="m3-btn-filled !px-12 !py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <Loader2 v-if="submitting" class="w-4 h-4 animate-spin" />
          提交发布
        </button>
      </div>
    </div>
  </form>
</template>
