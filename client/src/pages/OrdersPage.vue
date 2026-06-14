<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Package, CheckCircle2, Clock, XCircle, CreditCard, Star } from 'lucide-vue-next'
import { getJson, patchJson } from '../composables/useApi.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const router = useRouter()
const route = useRoute()
const orders = ref([])
const tabs = ref([])
const statusInfo = ref({})
const activeTab = ref(route.query.tab || 'all')
const { accountId } = useCurrentAccount()

onMounted(async () => {
  const [ordersData, ui] = await Promise.all([getJson(`/api/orders?userId=${accountId.value}`), getJson('/api/ui')])
  orders.value = ordersData.orders
  tabs.value = ui.orders?.tabs || []
  statusInfo.value = ui.orders?.statusInfo || {}
})

const filteredOrders = computed(() => activeTab.value === 'all' ? orders.value : orders.value.filter((o) => o.status === activeTab.value))
const isBuyer = (order) => String(order.userId) === String(accountId.value)
const isSeller = (order) => String(order.sellerId) === String(accountId.value)

const getStatusInfo = (status, order) => {
  if (status === 'paid_unconfirmed') {
    if (order?.buyerPaid && !order?.sellerConfirmed) return { label: '买家已付款', color: 'text-amber-500', bg: 'bg-amber-50/40', border: 'border-amber-100' }
    if (!order?.buyerPaid && order?.sellerConfirmed) return { label: '卖家已收款', color: 'text-amber-500', bg: 'bg-amber-50/40', border: 'border-amber-100' }
    return { label: '待确认', color: 'text-amber-500', bg: 'bg-amber-50/40', border: 'border-amber-100' }
  }
  if (status === 'paid') return { label: '未放置', color: 'text-blue-500', bg: 'bg-blue-50/40', border: 'border-blue-100' }
  if (status === 'delivered') return { label: '未收货', color: 'text-purple-500', bg: 'bg-purple-50/40', border: 'border-purple-100' }
  return statusInfo.value[status] || statusInfo.value.cancelled || {}
}

const runOrderAction = async (order, action) => {
  if (action === 'review') return router.push(`/evaluate/${order.id}`)
  if (action === 'rebuy') {
    return router.push(`/messages?contactId=${encodeURIComponent(order.sellerId || 'me')}&contactName=${encodeURIComponent(order.seller || '浙大同学')}&bookId=${encodeURIComponent(order.bookId)}&bookTitle=${encodeURIComponent(order.title)}`)
  }
  if (action === 'cancel' && !confirm('确定取消该订单吗？取消后书籍将重新上架到广场。')) return
  try {
    const data = await patchJson(`/api/orders/${order.id}`, { action })
    Object.assign(order, data.order)
    if (data.order.status === 'completed') alert('交易已完成，双方各获得 5 积分奖励。')
  } catch (err) {
    alert(err.message || '操作失败，请重试')
  }
}

</script>

<template>
  <div class="max-w-[1000px] mx-auto flex flex-col gap-8 py-8">
    <div class="flex justify-between items-end"><div><h1 class="text-3xl font-black text-gray-800 mb-2">订单中心</h1><p class="text-sm text-gray-500 font-medium">查看每一笔教材交易的履约状态。</p></div></div>
    <div class="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit"><button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all', activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50']">{{ tab.label }}</button></div>
    <div class="flex flex-col gap-6">
      <div v-for="order in filteredOrders" :key="order.id" :class="['bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-md transition-all', getStatusInfo(order.status, order).border]">
        <div :class="[getStatusInfo(order.status, order).bg, 'px-8 py-4 flex justify-between items-center border-b', getStatusInfo(order.status, order).border]">
          <div class="flex items-center gap-6 text-[11px] font-bold text-gray-400"><span class="text-gray-600">{{ order.date }}</span><span>Order: TRD-{{ order.id.toUpperCase() }}</span></div>
          <div :class="['text-sm font-black flex items-center gap-1.5', getStatusInfo(order.status, order).color]">
            <Clock v-if="order.status === 'unpaid'" class="w-4 h-4" />
            <CreditCard v-if="order.status === 'paid_unconfirmed' || order.status === 'paid'" class="w-4 h-4" />
            <Package v-if="order.status === 'delivered'" class="w-4 h-4" />
            <CheckCircle2 v-if="order.status === 'completed'" class="w-4 h-4" />
            <XCircle v-if="order.status === 'cancelled'" class="w-4 h-4" />
            {{ getStatusInfo(order.status, order).label }}
          </div>
        </div>
        <div class="p-8 flex flex-col md:flex-row gap-8 items-center">
          <div class="flex-1 flex gap-6"><img :src="order.cover" loading="lazy" decoding="async" class="w-24 h-32 object-cover rounded-2xl border border-gray-100 shadow-md" /><div class="flex flex-col justify-center"><h3 class="font-bold text-gray-800 text-xl mb-2">{{ order.title }}</h3><div class="text-sm text-gray-500">卖家：<span class="font-bold text-gray-700">{{ order.seller }}</span></div><div class="text-xs text-gray-400 mt-2">取货地：{{ order.location || '未约定' }}</div></div></div>
          <div class="flex flex-col items-end gap-4 min-w-[220px]">
            <div class="text-3xl font-black text-gray-800">¥ {{ Number(order.price || 0).toFixed(2) }}</div>
            <div class="flex flex-wrap gap-3 justify-end">
              <!-- 未支付/待确认：买家显示已付款，卖家显示已收款 -->
              <button v-if="(order.status === 'unpaid' || (order.status === 'paid_unconfirmed' && !order.buyerPaid)) && isBuyer(order)" @click="runOrderAction(order, 'pay')" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-200 flex items-center gap-2"><CreditCard class="w-4 h-4" /> 已付款</button>
              <button v-if="(order.status === 'unpaid' || (order.status === 'paid_unconfirmed' && !order.sellerConfirmed)) && isSeller(order)" @click="runOrderAction(order, 'confirm_receipt')" class="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-purple-200 flex items-center gap-2"><CreditCard class="w-4 h-4" /> 已收款</button>
              <!-- 未放置：卖家放书 -->
              <button v-if="order.status === 'paid' && isSeller(order)" @click="runOrderAction(order, 'deliver')" class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-indigo-200 flex items-center gap-2"><Package class="w-4 h-4" /> 已放</button>
              <!-- 未收货：买家确认收货 -->
              <button v-if="order.status === 'delivered' && isBuyer(order)" @click="runOrderAction(order, 'confirm')" class="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-green-200 flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> 已收货</button>
              <!-- 取消订单：买家在未完成阶段可取消 -->
              <button v-if="['unpaid', 'paid_unconfirmed', 'paid', 'delivered'].includes(order.status) && isBuyer(order)" @click="runOrderAction(order, 'cancel')" class="bg-white border border-gray-200 text-gray-500 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5 hover:text-red-500"><XCircle class="w-4 h-4" /> 取消订单</button>
              <!-- 完成后评价 -->
              <button v-if="order.status === 'completed' && !order.reviewed && isBuyer(order)" @click="runOrderAction(order, 'review')" class="bg-white border-2 border-blue-600 text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-1.5"><Star class="w-4 h-4" /> 评价</button>
              <button v-if="order.status === 'cancelled'" @click="runOrderAction(order, 'rebuy')" class="text-sm font-bold text-blue-600 hover:underline">再次购买</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredOrders.length === 0" class="bg-white rounded-3xl border border-gray-100 p-20 text-center flex flex-col items-center"><Package class="w-16 h-16 text-gray-100 mb-4" /><p class="text-gray-400 font-bold text-lg">暂无订单</p><button @click="router.push('/books')" class="mt-4 text-blue-600 font-bold hover:underline">去逛广场</button></div>
    </div>
  </div>
</template>
