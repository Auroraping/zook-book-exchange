<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, CreditCard, Package, Send, ShieldAlert, ShoppingBag, Star, X } from 'lucide-vue-next'
import { getJson, patchJson, postJson } from '../composables/useApi.js'
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
const isBuyer = computed(() => currentBook.value ? String(currentBook.value.sellerId) !== String(accountId.value) : true)

const fetchOrderForChat = async () => {
  if (!props.activeChat?.bookId) {
    order.value = null
    return
  }
  const res = await getJson(`/api/orders?userId=${accountId.value}`).catch(() => ({ orders: [] }))
  order.value = (res.orders || []).find((item) => String(item.bookId) === String(props.activeChat.bookId) && item.status !== 'cancelled') || null
}

watch(() => props.activeChat, fetchOrderForChat, { immediate: true })

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
  const buyerId = isBuyer.value ? accountId.value : props.activeChat.id
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
  try {
    const res = await patchJson(`/api/orders/${order.value.id}`, { action })
    order.value = res.order
    const logs = {
      pay: `我已付款 ¥${Number(order.value.price).toFixed(2)}，请卖家确认收款。`,
      confirm_receipt: `我已确认收款，教材将尽快放到约定地点。`,
      deliver: `教材已放到约定地点：${order.value.location}，请买家取到后确认。`,
      confirm: `我已确认取到教材，交易完成。`
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
        <button v-if="order" @click="triggerFeedback" class="h-9 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black flex items-center gap-1.5"><ShieldAlert class="w-4 h-4" /> 订单反馈</button>
        <template v-if="!order">
          <button v-if="currentBook && currentBook.status === 'approved'" @click="openCreateOrderModal" class="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-200 flex items-center gap-1.5"><ShoppingBag class="w-4 h-4" /> 发起报价</button>
        </template>
        <template v-else>
          <div class="hidden lg:flex flex-col items-end text-[10px] text-gray-400 font-bold mr-1"><span>实付：¥{{ Number(order.price).toFixed(2) }}</span><span>地点：{{ order.location }}</span></div>
          <button v-if="order.status === 'unpaid' && isBuyer" @click="runOrderAction('pay')" class="h-9 px-5 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><CreditCard class="w-4 h-4" /> 立即支付</button>
          <button v-if="order.status === 'paid_unconfirmed' && !isBuyer" @click="runOrderAction('confirm_receipt')" class="h-9 px-5 bg-purple-600 text-white rounded-xl text-xs font-black">我已收款</button>
          <button v-if="order.status === 'paid' && !isBuyer" @click="runOrderAction('deliver')" class="h-9 px-5 bg-indigo-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><Package class="w-4 h-4" /> 我已发货</button>
          <button v-if="order.status === 'delivered' && isBuyer" @click="runOrderAction('confirm')" class="h-9 px-5 bg-green-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5"><CheckCircle2 class="w-4 h-4" /> 已到货</button>
          <button v-if="order.status === 'completed' && isBuyer && !order.reviewed" @click="showReviewModal = true" class="h-9 px-5 bg-white border border-blue-600 text-blue-600 rounded-xl text-xs font-black flex items-center gap-1.5"><Star class="w-4 h-4" /> 评价</button>
        </template>
      </div>
    </div>

    <div class="flex-1 p-8 overflow-y-auto bg-gray-50/30 flex flex-col gap-6">
      <template v-for="message in messages" :key="message.id">
        <div v-if="message.role === 'other'" class="flex items-start gap-4 max-w-[85%]">
          <img :src="activeChat.avatar || '/user_avatar.png'" class="w-9 h-9 rounded-full border border-gray-100 bg-white shadow-sm object-cover" />
          <div v-if="message.msgType === 'proposal'" class="bg-white border border-blue-200 p-4 rounded-2xl rounded-tl-none shadow-sm min-w-[220px]">
            <div class="flex items-center gap-1.5 text-blue-600 font-black text-xs mb-2"><ShoppingBag class="w-3.5 h-3.5"/> 收到交易报价</div>
            <div class="text-2xl font-black text-gray-800 mb-1">¥{{ Number(message.proposalData.price).toFixed(2) }}</div>
            <div class="text-xs text-gray-500 font-bold mb-4 flex items-center gap-1"><Package class="w-3.5 h-3.5"/> {{ message.proposalData.location }}</div>
            <button v-if="message.proposalData.status === 'pending' && !order" @click="acceptProposal(message)" class="w-full py-2 bg-blue-600 text-white rounded-xl text-xs font-black">同意报价并生成订单</button>
            <div v-else class="w-full py-2 bg-green-50 text-green-600 rounded-xl text-xs font-black flex items-center justify-center gap-1"><CheckCircle2 class="w-4 h-4"/> 已处理</div>
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
          <div v-else class="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none text-sm shadow leading-relaxed whitespace-pre-wrap break-words">{{ message.content }}</div>
          <img :src="user?.avatar || '/user_avatar.png'" class="w-9 h-9 rounded-full border-2 border-white shadow object-cover bg-white shrink-0" />
        </div>
      </template>
    </div>

    <div class="p-6 bg-white border-t border-gray-50 flex gap-4"><textarea v-model="draft" class="flex-1 bg-gray-50 border-none rounded-2xl p-4 text-sm outline-none focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 transition-all resize-none h-24" placeholder="发送消息..." @keydown.enter.exact.prevent="send"></textarea><button @click="send" class="w-14 h-24 bg-blue-600 rounded-2xl flex items-center justify-center text-white hover:shadow-lg transition-all active:scale-95"><Send class="w-6 h-6" /></button></div>

    <div v-if="showCreateOrderModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div class="bg-white border border-slate-100 shadow-xl rounded-[32px] w-full max-w-sm p-6 relative">
        <div class="flex items-center justify-between mb-4"><h3 class="text-base font-black text-gray-900">发起购书交易</h3><button @click="showCreateOrderModal = false" class="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"><X class="w-4 h-4" /></button></div>
        <div class="space-y-4">
          <input v-model="dealPrice" type="number" step="0.01" class="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none" placeholder="交易金额" />
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
  </template>
</template>
