<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, CreditCard, Image, Package, Send, ShieldAlert, ShoppingBag, Star, X, ChevronUp, ChevronDown } from 'lucide-vue-next'
import { getJson, patchJson, postJson, uploadFile } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const props = defineProps({
  books: { type: Array, required: true },
  activeChat: { type: Object, default: null },
  messages: { type: Array, required: true }
})
const emit = defineEmits(['send'])

const router = useRouter()
const { user, accountId } = useCurrentAccount()
const draft = ref('')
const order = ref(null)
const showCreateOrderModal = ref(false)
const dealPrice = ref('')
const dealLocation = ref('')
const creatingOrder = ref(false)
const showReviewModal = ref(false)
const reviewRating = ref(5)
const submittingReview = ref(false)

const currentBook = computed(() => props.activeChat?.bookId ? props.books.find((b) => String(b.id) === String(props.activeChat.bookId)) : null)
const isBookSeller = computed(() => currentBook.value && String(currentBook.value.sellerId) === String(accountId.value))
const canActAsBuyer = computed(() => !order.value || String(order.value.userId) === String(accountId.value))
const canActAsSeller = computed(() => {
  if (!order.value) return !!isBookSeller.value
  return String(order.value.sellerId) === String(accountId.value)
})

const activeOrderStatuses = new Set(['unpaid', 'paid_unconfirmed', 'paid', 'delivered'])
const fetchOrderForChat = async () => {
  if (!props.activeChat?.bookId) {
    order.value = null
    return
  }
  const res = await getJson(`/api/orders?userId=${accountId.value}`).catch(() => ({ orders: [] }))
  order.value = (res.orders || []).find((item) => String(item.bookId) === String(props.activeChat.bookId) && activeOrderStatuses.has(item.status)) || null
}

const messageContainer = ref(null)

const scrollToBottom = () => {
  nextTick(() => {
    if (messageContainer.value) {
      messageContainer.value.scrollTop = messageContainer.value.scrollHeight
    }
  })
}

watch(() => props.activeChat, () => {
  fetchOrderForChat()
  scrollToBottom()
}, { immediate: true })

watch(() => props.messages, () => {
  fetchOrderForChat()
  scrollToBottom()
}, { deep: true })

const send = () => {
  const text = draft.value.trim()
  if (!text) return
  draft.value = ''
  emit('send', text)
}

const openCreateOrderModal = () => {
  dealPrice.value = currentBook.value?.price || ''
  dealLocation.value = ''
  showCreateOrderModal.value = true
}

const submitCreateOrder = async () => {
  if (!dealPrice.value || Number(dealPrice.value) <= 0) return alert('请输入合理的交易金额')
  if (!dealLocation.value.trim()) return alert('请输入约定的取货地点')
  creatingOrder.value = true
  try {
    const text = `我发起了一笔交易报价，金额 ¥${dealPrice.value}，地点：${dealLocation.value.trim()}。请确认。`
    const res = await postJson(`/api/chats/${props.activeChat.id}/messages`, {
      text,
      userId: accountId.value,
      msgType: 'proposal',
      proposalData: {
        bookId: props.activeChat.bookId,
        price: Number(dealPrice.value),
        location: dealLocation.value.trim(),
        status: 'pending'
      }
    })
    if (isBookSeller.value) {
      const orderRes = await postJson('/api/orders', {
        bookId: props.activeChat.bookId,
        price: Number(dealPrice.value),
        location: dealLocation.value.trim(),
        userId: props.activeChat.id
      })
      order.value = orderRes.order
      if (res.message?.proposalData) res.message.proposalData.status = 'accepted'
    }
    showCreateOrderModal.value = false
    emit('send', { type: 'special_proposal', message: res.message })
  } catch (err) {
    alert(err.message || '发起报价失败')
  } finally {
    creatingOrder.value = false
  }
}

const acceptProposal = async (msg) => {
  const proposal = msg.proposalData
  const buyerId = isBookSeller.value ? props.activeChat.id : accountId.value
  try {
    const orderRes = await postJson('/api/orders', {
      bookId: proposal.bookId,
      price: proposal.price,
      location: proposal.location,
      userId: buyerId
    })
    await patchJson(`/api/chats/${props.activeChat.id}/messages/${msg.id}/accept`, { userId: accountId.value })
    msg.proposalData.status = 'accepted'
    order.value = orderRes.order
    emit('send', `我已同意报价（¥${proposal.price}，${proposal.location}），订单已生成。`)
  } catch (err) {
    alert(err.message || '接受报价失败')
  }
}

const runOrderAction = async (action) => {
  if (action === 'cancel' && !confirm('确定取消该订单吗？取消后书籍将重新上架到广场。')) return
  try {
    const res = await patchJson(`/api/orders/${order.value.id}`, { action })
    order.value = res.order
    const logs = {
      pay: `我已付款 ¥${Number(order.value.price).toFixed(2)}，请卖家确认收款。`,
      confirm_receipt: `我已确认收款，等待双方确认完成后将放置教材。`,
      deliver: `教材已放到约定地点：${order.value.location}，请买家前往取书并确认收货。`,
      confirm: `我已确认取到教材，交易完成。`,
      cancel: `我已取消订单，书籍已重新上架到广场。`
    }
    if (logs[action]) emit('send', logs[action])
    if (action === 'confirm') alert('交易完成，双方各获得 5 积分奖励。')
  } catch (err) {
    alert(err.message || '订单操作失败')
  }
}

const submitReview = async () => {
  submittingReview.value = true
  try {
    const res = await postJson(`/api/orders/${order.value.id}/review`, {
      userId: accountId.value,
      rating: reviewRating.value,
      content: '聊天页快速履约评分'
    })
    order.value = res.order
    showReviewModal.value = false
  } catch (err) {
    alert(err.message || '评价失败')
  } finally {
    submittingReview.value = false
  }
}

const triggerFeedback = () => {
  if (!order.value) return
  const initialMsg = `你好，我的订单 TRD-${order.value.id.toUpperCase()} 遇到了问题，想发起申诉和反馈。`
  router.push(`/messages?contactId=customer-service&contactName=官方客服&initialMsg=${encodeURIComponent(initialMsg)}`)
}

// 图片发送相关
const fileInput = ref(null)
const uploading = ref(false)
const previewImageUrl = ref('')

const showPreviewModal = computed(() => !!previewImageUrl.value)
const closePreview = () => { previewImageUrl.value = '' }

const triggerFileSelect = () => {
  fileInput.value?.click()
}

const handleFileSelected = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  // 只允许图片格式
  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }
  // 限制文件大小 10MB
  if (file.size > 10 * 1024 * 1024) {
    alert('图片大小不能超过 10MB')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await uploadFile('/api/chats/upload-image', formData)
    if (res.success && res.url) {
      // 发送图片消息
      emit('send', { type: 'image', imageUrl: res.url, text: '' })
    }
  } catch (err) {
    alert(err.message || '图片上传失败')
  } finally {
    uploading.value = false
    // 重置 input 以便重复选择同一文件
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <template v-if="activeChat">
    <div class="px-8 py-4 bg-slate-50 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div v-if="currentBook" class="flex items-center gap-3.5 flex-1 min-w-0">
        <img :src="currentBook.cover" class="w-10 h-14 object-cover rounded-lg shadow-sm bg-white" />
        <div class="min-w-0">
          <h5 class="font-black text-sm text-gray-800 truncate mb-1">{{ currentBook.title }}</h5>
          <span class="text-rose-500 font-bold text-sm">¥{{ currentBook.price }}</span>
        </div>
      </div>
      <div v-else class="text-xs text-gray-400 font-bold">正在沟通聊天</div>
      <div class="flex items-center gap-3 flex-shrink-0">
        <template v-if="!order">
          <button v-if="currentBook && currentBook.status === 'approved'" @click="openCreateOrderModal" class="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 flex items-center gap-1.5"><ShoppingBag class="w-4 h-4" /> 发起报价</button>
        </template>
        <template v-else>
          <div class="hidden lg:flex flex-col items-end text-[10px] text-gray-400 font-bold mr-1"><span>实付：¥{{ Number(order.price).toFixed(2) }}</span><span>地点：{{ order.location }}</span></div>
          <!-- 未支付：买家显示已付款，卖家显示已收款 -->
          <button v-if="(order.status === 'unpaid' || (order.status === 'paid_unconfirmed' && !order.buyerPaid)) && canActAsBuyer" @click="runOrderAction('pay')" class="h-9 px-5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><CreditCard class="w-4 h-4" /> 已付款</button>
          <button v-if="order.status === 'paid_unconfirmed' && order.buyerPaid && !order.sellerConfirmed && canActAsSeller" @click="runOrderAction('confirm_receipt')" class="h-9 px-5 bg-purple-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><CreditCard class="w-4 h-4" /> 已收款</button>
          <!-- 未放置：卖家放书 -->
          <button v-if="order.status === 'paid' && canActAsSeller" @click="runOrderAction('deliver')" class="h-9 px-5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><Package class="w-4 h-4" /> 已放</button>
          <!-- 未收货：买家确认收货 -->
          <button v-if="order.status === 'delivered' && canActAsBuyer" @click="runOrderAction('confirm')" class="h-9 px-5 bg-green-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><CheckCircle2 class="w-4 h-4" /> 已收货</button>
          <!-- 取消订单：买家在未完成阶段可取消 -->
          <button v-if="['unpaid', 'paid_unconfirmed', 'paid', 'delivered'].includes(order.status) && canActAsBuyer" @click="runOrderAction('cancel')" class="h-9 px-3.5 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-xl text-xs font-black flex items-center gap-1.5"><X class="w-4 h-4" /> 取消订单</button>
          <!-- 完成后评价 -->
          <button v-if="order.status === 'completed' && canActAsBuyer && !order.reviewed" @click="showReviewModal = true" class="h-9 px-5 bg-white border border-blue-600 text-blue-600 rounded-xl text-xs font-black flex items-center gap-1.5"><Star class="w-4 h-4" /> 评价</button>
        </template>
      </div>
    </div>

    <div ref="messageContainer" class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
      <template v-for="message in messages" :key="message.id">
        <div v-if="message.role === 'other'" class="flex items-start gap-4 max-w-[85%]">
          <img :src="activeChat.avatar || '/user_avatar.png'" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm object-cover" />
          <div v-if="message.msgType === 'proposal'" class="bg-white border border-blue-200 p-4 rounded-2xl rounded-tl-none shadow-sm min-w-[220px]">
            <div class="flex items-center gap-1.5 text-blue-600 font-black text-xs mb-2"><ShoppingBag class="w-3.5 h-3.5"/> 收到交易报价</div>
            <div class="text-2xl font-black text-gray-800 mb-1">¥{{ Number(message.proposalData.price).toFixed(2) }}</div>
            <div class="text-xs text-gray-500 font-bold mb-4 flex items-center gap-1"><Package class="w-3.5 h-3.5"/> {{ message.proposalData.location }}</div>
            <button v-if="message.proposalData.status === 'pending' && !order" @click="acceptProposal(message)" class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black">同意报价并生成订单</button>
            <div v-else-if="message.proposalData.status !== 'pending'" class="w-full py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black flex items-center justify-center gap-1"><CheckCircle2 class="w-4 h-4"/> 已处理</div>
            <div v-else class="w-full py-2 bg-amber-50 text-amber-600 rounded-xl text-xs font-black flex items-center justify-center gap-1"><ShoppingBag class="w-4 h-4"/> 请先处理进行中的订单</div>
          </div>
          <div v-else-if="message.msgType === 'image'" class="bg-white border border-gray-100 rounded-2xl rounded-tl-none overflow-hidden shadow-sm">
            <img :src="message.imageUrl" class="max-w-[260px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="previewImageUrl = message.imageUrl" />
            <p v-if="message.content" class="text-sm text-gray-800 px-3 pb-3 leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</p>
          </div>
          <div v-else class="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none text-sm text-gray-800 shadow-sm leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</div>
        </div>
        <div v-else class="flex items-start justify-end gap-4 max-w-[85%] self-end">
          <div v-if="message.msgType === 'proposal'" class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow min-w-[220px]">
            <div class="flex items-center gap-1.5 text-blue-100 font-black text-xs mb-2"><ShoppingBag class="w-3.5 h-3.5"/> 我发出的报价</div>
            <div class="text-2xl font-black text-white mb-1">¥{{ Number(message.proposalData.price).toFixed(2) }}</div>
            <div class="text-xs text-blue-100 font-bold mb-3 flex items-center gap-1"><Package class="w-3.5 h-3.5"/> {{ message.proposalData.location }}</div>
            <div class="w-full py-1.5 bg-blue-700/50 rounded-lg text-xs font-black text-center">{{ message.proposalData.status === 'pending' ? '等待对方确认' : '对方已接受' }}</div>
          </div>
          <div v-else-if="message.msgType === 'image'" class="bg-blue-600 rounded-2xl rounded-tr-none overflow-hidden shadow">
            <img :src="message.imageUrl" class="max-w-[260px] max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity" @click="previewImageUrl = message.imageUrl" />
            <p v-if="message.content" class="text-sm text-white px-3 pb-3 leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</p>
          </div>
          <div v-else class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</div>
          <img :src="user?.avatar || '/user_avatar.png'" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white shrink-0" />
        </div>
      </template>
    </div>

    <div class="p-6 bg-white border-t border-gray-50 flex gap-3 items-end">
      <button @click="triggerFileSelect" :disabled="uploading" :class="['w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shrink-0', uploading ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:shadow-lg']" title="发送图片">
        <Image class="w-6 h-6" />
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelected" />
      <textarea v-model="draft" class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-20" placeholder="发送消息..." @keydown.enter.exact.prevent="send"></textarea>
      <button @click="send" :disabled="!draft.trim()" class="w-14 h-20 rounded-2xl flex items-center justify-center text-white transition-all active:scale-95 shrink-0" :class="draft.trim() ? 'bg-blue-600 hover:shadow-lg' : 'bg-gray-300 cursor-not-allowed'"><Send class="w-6 h-6" /></button>
    </div>

    <div v-if="showCreateOrderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white border border-slate-100 shadow-xl rounded-[32px] w-full max-w-sm p-6 relative">
        <div class="flex items-center justify-between mb-4"><h3 class="text-base font-black text-gray-900">发起购书交易</h3><button @click="showCreateOrderModal = false" class="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X class="w-4 h-4" /></button></div>
        <div class="space-y-4">
          <div class="relative">
            <input v-model="dealPrice" type="number" step="0.01" class="w-full pl-4 pr-12 py-2.5 rounded-xl border border-gray-200 text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="交易金额" />
            <div class="absolute right-2 top-0 bottom-0 flex flex-col justify-center gap-0.5">
              <button type="button" @click="dealPrice = (Number(dealPrice || 0) + 1).toFixed(2)" class="w-6 h-4 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors">
                <ChevronUp class="w-3.5 h-3.5" />
              </button>
              <button type="button" @click="dealPrice = Math.max(0, Number(dealPrice || 0) - 1).toFixed(2)" class="w-6 h-4 flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors">
                <ChevronDown class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <input v-model="dealLocation" type="text" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="约定取货地点" />
        </div>
        <div class="flex gap-3 mt-6"><button @click="showCreateOrderModal = false" class="flex-1 py-2.5 rounded-xl border border-gray-100 text-gray-500 font-bold text-xs">取消</button><button @click="submitCreateOrder" :disabled="creatingOrder" class="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs disabled:opacity-50">{{ creatingOrder ? '发起中...' : '确认发起' }}</button></div>
      </div>
    </div>

    <div v-if="showReviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white border border-slate-100 shadow-xl rounded-[32px] w-full max-w-xs p-6 text-center">
        <h3 class="text-base font-black text-gray-900 mb-2">为卖家评分</h3>
        <div class="flex items-center justify-center gap-2 mb-6"><button v-for="star in 5" :key="star" @click="reviewRating = star" class="p-1 hover:scale-110 transition-transform"><Star :class="['w-7 h-7', star <= reviewRating ? 'text-yellow-400 fill-current' : 'text-gray-200']" /></button></div>
        <div class="flex gap-3"><button @click="showReviewModal = false" class="flex-1 py-2 rounded-xl border border-gray-100 text-gray-500 font-bold text-xs">暂不评价</button><button @click="submitReview" :disabled="submittingReview" class="flex-1 py-2 rounded-xl bg-yellow-500 text-white font-bold text-xs">提交评分</button></div>
      </div>
    </div>

    <!-- 图片预览模态框 -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" @click.self="closePreview">
      <div class="relative max-w-[90vw] max-h-[90vh]">
        <button @click="closePreview" class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors z-10">
          <X class="w-4 h-4" />
        </button>
        <img :src="previewImageUrl" class="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
      </div>
    </div>
  </template>
</template>
