<script setup>
import { ref, onMounted, computed } from 'vue'
import { ShieldCheck, Ban, CheckCircle2, XCircle } from 'lucide-vue-next'
import { getJson, patchJson } from '../composables/useApi.js'

const books = ref([])
const reports = ref([])

onMounted(async () => {
  const [booksData, reportsData] = await Promise.all([getJson('/api/books'), getJson('/api/reports')])
  books.value = booksData.books
  reports.value = reportsData.reports
})

const pendingBooks = computed(() => books.value.filter((b) => b.status === 'pending'))
const reviewBook = async (book, status) => Object.assign(book, (await patchJson(`/api/books/${book.id}`, { status })).book)
const resolveReport = async (report) => Object.assign(report, (await patchJson(`/api/reports/${report.id}`, { status: 'resolved' })).report)
</script>

<template>
  <div class="max-w-5xl mx-auto py-8 animate-google-in">
    <div class="flex items-center gap-4 mb-10"><div class="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck class="w-7 h-7" /></div><div><h1 class="text-3xl font-black text-gray-900">管理后台</h1><p class="text-sm text-gray-500 font-medium">审核书籍发布和用户举报。</p></div></div>
    <section class="mb-12">
      <h2 class="text-xl font-bold text-gray-800 mb-6">待审核发布</h2>
      <div v-if="pendingBooks.length > 0" class="flex flex-col gap-4">
        <div v-for="book in pendingBooks" :key="book.id" class="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
          <img :src="book.cover" class="w-16 h-24 rounded-xl object-cover" /><div class="flex-1"><h3 class="font-bold text-gray-800">{{ book.title }}</h3><p class="text-sm text-gray-500">{{ book.seller }} - ¥{{ book.price }}</p></div>
          <div class="flex gap-3"><button @click="reviewBook(book, 'approved')" class="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold flex items-center gap-1"><CheckCircle2 class="w-4 h-4" /> 通过</button><button @click="reviewBook(book, 'rejected')" class="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-bold flex items-center gap-1"><XCircle class="w-4 h-4" /> 驳回</button></div>
        </div>
      </div>
      <div v-else class="bg-gray-50 rounded-2xl p-12 text-center text-gray-400 font-bold">暂无待审核发布</div>
    </section>
    <section>
      <h2 class="text-xl font-bold text-gray-800 mb-6">举报记录</h2>
      <div class="flex flex-col gap-4">
        <div v-for="report in reports" :key="report.id" class="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-6">
          <div class="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><Ban class="w-6 h-6" /></div><div class="flex-1"><h3 class="font-bold text-gray-800">书籍 #{{ report.bookId }}</h3><p class="text-sm text-gray-500">原因：{{ report.reason }}</p></div>
          <button v-if="report.status === 'pending'" @click="resolveReport(report)" class="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold">标记已处理</button><span v-else class="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">{{ report.status }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
