<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Trash2, ShoppingBag, CheckCircle2, ShieldCheck, Clock } from 'lucide-vue-next'

const cartItems = ref([])
const isSuccess = ref(false)

onMounted(async () => {
  const res = await fetch('/data/books.json')
  const allBooks = await res.json()
  const savedCart = JSON.parse(localStorage.getItem('cart') || '[]')
  cartItems.value = savedCart.map((id) => allBooks.find((b) => b.id === id)).filter(Boolean)
})

const removeFromCart = (id) => {
  cartItems.value = cartItems.value.filter((item) => item.id !== id)
  localStorage.setItem('cart', JSON.stringify(cartItems.value.map((i) => i.id)))
  window.dispatchEvent(new Event('cartUpdated'))
}

const totalPrice = computed(() => cartItems.value.reduce((sum, item) => sum + item.price, 0))

const submitOrder = () => {
  isSuccess.value = true
  localStorage.setItem('cart', '[]')
  window.dispatchEvent(new Event('cartUpdated'))
}
</script>

<template>
  <div v-if="isSuccess" class="max-w-2xl mx-auto py-32 text-center animate-google-in">
    <div class="w-24 h-24 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8"><CheckCircle2 class="w-12 h-12" /></div>
    <h1 class="text-4xl font-normal text-gray-900 mb-4">订单已极速同步</h1>
    <p class="text-gray-500 mb-12 text-lg">系统已通知卖家，请在"消息"中查看后续交付约定。</p>
    <RouterLink to="/books" class="m3-btn-filled !px-12">继续探索</RouterLink>
  </div>
  <div v-else class="max-w-6xl mx-auto py-12 animate-google-in">
    <div class="flex items-baseline gap-4 mb-12">
      <h1 class="text-5xl font-normal text-gray-900 tracking-tight">购书清单</h1>
      <span class="text-xl text-gray-400 font-normal">{{ cartItems.length }} 个项目</span>
    </div>
    <div v-if="cartItems.length > 0" class="grid grid-cols-12 gap-12">
      <div class="col-span-8 flex flex-col gap-6">
        <div v-for="item in cartItems" :key="item.id" class="bg-white rounded-[28px] p-6 flex gap-8 items-center border border-gray-100 hover:shadow-sm transition-all group">
          <div class="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm"><img :src="item.cover" :alt="item.title" class="w-full h-full object-cover" /></div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{{ item.campus }}</span>
              <span class="text-[10px] font-bold text-gray-400">· {{ item.condition }}</span>
            </div>
            <h3 class="text-xl font-medium text-gray-900 mb-2">{{ item.title }}</h3>
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1.5 text-xs text-gray-400"><ShieldCheck class="w-4 h-4 text-green-500" /> 担保交易</div>
              <div class="flex items-center gap-1.5 text-xs text-gray-400"><Clock class="w-4 h-4" /> 预计今日交付</div>
            </div>
          </div>
          <div class="text-right flex flex-col items-end gap-8">
            <span class="text-2xl font-normal text-gray-900">¥{{ item.price }}</span>
            <button @click="removeFromCart(item.id)" class="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 class="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      <div class="col-span-4">
        <div class="bg-[#f0f4f8] rounded-[32px] p-10 sticky top-24">
          <h4 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-10">订单摘要</h4>
          <div class="space-y-6 mb-10">
            <div class="flex justify-between text-base font-medium text-gray-600"><span>商品金额</span><span>¥{{ totalPrice.toFixed(2) }}</span></div>
            <div class="flex justify-between text-base font-medium text-gray-600"><span>校内转运</span><span class="text-blue-600">免运费</span></div>
            <div class="flex justify-between text-base font-medium text-gray-600"><span>回收补贴</span><span class="text-green-600">- ¥5.00</span></div>
          </div>
          <hr class="border-gray-200 mb-10" />
          <div class="flex justify-between items-baseline mb-12">
            <span class="text-lg font-bold text-gray-800">应付总额</span>
            <span class="text-4xl font-medium text-gray-900">¥{{ (totalPrice - 5).toFixed(2) }}</span>
          </div>
          <button @click="submitOrder" class="w-full m3-btn-filled !rounded-full !py-6 justify-center text-lg shadow-xl shadow-blue-200">确认并提交订单</button>
          <div class="mt-8 flex items-start gap-3">
            <ShieldCheck class="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p class="text-[10px] text-gray-400 leading-relaxed font-medium">浙里淘书保障每一笔交易。资金将暂存于平台，待您线下扫码确认收货后，款项才会拨付给卖家。</p>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="py-32 flex flex-col items-center justify-center text-center">
      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-8"><ShoppingBag class="w-12 h-12" /></div>
      <h2 class="text-3xl font-normal text-gray-900 mb-4">您的清单目前为空</h2>
      <p class="text-gray-500 mb-12 max-w-sm text-lg">去发现更多由校友分享的优质学术资源。</p>
      <RouterLink to="/books" class="m3-btn-filled !px-10">开始探索</RouterLink>
    </div>
  </div>
</template>
