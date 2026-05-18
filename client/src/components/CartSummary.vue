<script setup>
import { ShieldCheck } from 'lucide-vue-next'

const props = defineProps({
  totalPrice: { type: Number, required: true }
})
const emit = defineEmits(['submit'])
</script>

<template>
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
      <button @click="emit('submit')" class="w-full m3-btn-filled !rounded-full !py-6 justify-center text-lg shadow-xl shadow-blue-200">确认并提交订单</button>
      <div class="mt-8 flex items-start gap-3">
        <ShieldCheck class="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
        <p class="text-[10px] text-gray-400 leading-relaxed font-medium">浙里淘书保障每一笔交易。资金将暂存于平台，待您线下扫码确认收货后，款项才会拨付给卖家。</p>
      </div>
    </div>
  </div>
</template>
