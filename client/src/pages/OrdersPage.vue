<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Package, MapPin, CheckCircle2, Clock, XCircle, CreditCard, Star } from 'lucide-vue-next'

const router = useRouter()
const orders = ref([])
const tabs = ref([])
const statusInfo = ref({})

onMounted(async () => {
  const [ordersRes, uiRes] = await Promise.all([fetch('/data/orders.json'), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  orders.value = await ordersRes.json()
  tabs.value = ui.orders?.tabs || []
  statusInfo.value = ui.orders?.statusInfo || {}
})

const activeTab = ref('all')

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  return orders.value.filter((o) => o.status === activeTab.value)
})

const getStatusInfo = (status) => {
  return statusInfo.value[status] || statusInfo.value.cancelled || {}
}
</script>

<template>
  <div class="max-w-[1000px] mx-auto flex flex-col gap-8 py-8">
    <div class="flex justify-between items-end">
      <div><h1 class="text-3xl font-black text-gray-800 mb-2">我的履约中心</h1><p class="text-sm text-gray-500 font-medium">管理你在浙大二手的每一笔知识流转</p></div>
    </div>
    <div class="flex gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id" :class="['flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-xl transition-all', activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:bg-gray-50']">{{ tab.label }}</button>
    </div>
    <div class="flex flex-col gap-6">
      <div v-for="order in filteredOrders" :key="order.id" :class="['bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-md transition-all', getStatusInfo(order.status).border]">
        <div :class="[getStatusInfo(order.status).bg, 'px-8 py-4 flex justify-between items-center border-b', getStatusInfo(order.status).border]">
          <div class="flex items-center gap-6 text-[11px] font-bold text-gray-400"><span class="text-gray-600">{{ order.date }}</span><span>订单号: TRD-{{ order.id.toUpperCase() }}</span></div>
          <div :class="['text-sm font-black flex items-center gap-1.5', getStatusInfo(order.status).color]">
            <Clock v-if="order.status === 'unpaid'" class="w-4 h-4" /><MapPin v-if="order.status === 'pending'" class="w-4 h-4" /><CheckCircle2 v-if="order.status === 'completed'" class="w-4 h-4" /><XCircle v-if="order.status === 'cancelled'" class="w-4 h-4" />
            {{ getStatusInfo(order.status).label }}
          </div>
        </div>
        <div class="p-8 flex flex-col md:flex-row gap-8 items-center">
          <div class="flex-1 flex gap-6">
            <img :src="order.cover" class="w-24 h-32 object-cover rounded-2xl border border-gray-100 shadow-md" />
            <div class="flex flex-col justify-center">
              <h3 class="font-bold text-gray-800 text-xl mb-2">{{ order.title }}</h3>
              <div class="flex items-center gap-2 text-sm text-gray-500">卖家: <span class="font-bold text-gray-700">{{ order.seller }}</span></div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-4 min-w-[220px]">
            <div class="text-3xl font-black text-gray-800">¥ {{ order.price.toFixed(2) }}</div>
            <div class="flex gap-3">
              <button v-if="order.status === 'unpaid'" class="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-blue-200 flex items-center gap-2"><CreditCard class="w-4 h-4" /> 立即支付</button>
              <button v-if="order.status === 'pending'" class="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-green-200 flex items-center gap-2"><CheckCircle2 class="w-4 h-4" /> 确认已收货</button>
              <button v-if="order.status === 'completed'" class="bg-white border-2 border-blue-600 text-blue-600 px-8 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2"><Star class="w-4 h-4" /> 评价并获取积分</button>
              <button v-if="order.status === 'cancelled'" class="text-sm font-bold text-blue-600 hover:underline">重新购买</button>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredOrders.length === 0" class="bg-white rounded-3xl border border-gray-100 p-20 text-center flex flex-col items-center">
        <Package class="w-16 h-16 text-gray-100 mb-4" />
        <p class="text-gray-400 font-bold text-lg">暂无相关订单信息</p>
        <button @click="router.push('/books')" class="mt-4 text-blue-600 font-bold hover:underline">去购书大厅逛逛</button>
      </div>
    </div>
  </div>
</template>
