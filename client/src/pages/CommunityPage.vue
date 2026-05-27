<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import CommunityEmptyState from '../components/CommunityEmptyState.vue'
import CommunityFilterBar from '../components/CommunityFilterBar.vue'
import CommunityHero from '../components/CommunityHero.vue'
import CommunityNoteCard from '../components/CommunityNoteCard.vue'
import CommunityUploadModal from '../components/CommunityUploadModal.vue'
import { getJson } from '../composables/useApi.js'

const notes = ref([])
const activeFilter = ref('')
const keyword = ref('')
const filters = ref([])
const courseGroups = ref({})
const isUploadOpen = ref(false)

// 分页状态
const currentPage = ref(1)
const pageSize = ref(9) // 每页 9 条资料卡片（每行 3 张，正好占满 3 整行，极其美观对称）

const fetchNotes = async () => {
  const notesData = await getJson('/api/notes')
  notes.value = notesData.notes.map((note, index) => ({ ...note, listId: `${note.id}-${index}` }))
}

onMounted(async () => {
  const [, uiRes] = await Promise.all([fetchNotes(), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  filters.value = ui.community?.filters || []
  courseGroups.value = ui.community?.courseGroups || {}
  activeFilter.value = filters.value[0] || ''
})

const onUploadSuccess = async () => {
  isUploadOpen.value = false
  await fetchNotes()
}

const matchesFilter = (note, filter) => {
  if (!filter || filter === filters.value[0]) return true
  return (courseGroups.value[filter] || []).some((c) => note.course.includes(c))
}

const filteredNotes = computed(() => {
  return notes.value.filter((note) => {
    const haystack = `${note.title}${note.course}${note.author}${note.type}${(note.tags || []).join('')}`.toLowerCase()
    if (keyword.value.trim() && !haystack.includes(keyword.value.trim().toLowerCase())) return false
    return matchesFilter(note, activeFilter.value)
  })
})

// 计算总页数
const totalPages = computed(() => Math.ceil(filteredNotes.value.length / pageSize.value))

// 获取当前页的切片数据
const paginatedNotes = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredNotes.value.slice(start, start + pageSize.value)
})

// 当科目筛选或搜索词改变时，自动将当前页重置为第一页
watch([activeFilter, keyword], () => {
  currentPage.value = 1
})

// 翻页时平滑回到列表区顶部
const scrollToTop = () => {
  window.scrollTo({ top: 320, behavior: 'smooth' })
}

const filterCounts = computed(() => filters.value.reduce((acc, filter) => {
  acc[filter] = notes.value.filter((note) => matchesFilter(note, filter)).length
  return acc
}, {}))

const runSearch = () => {
  if (keyword.value.trim()) activeFilter.value = filters.value[0] || ''
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <CommunityHero v-model:keyword="keyword" @search="runSearch" @upload="isUploadOpen = true" />
    <section class="flex flex-col gap-6">
      <CommunityFilterBar v-model:activeFilter="activeFilter" :filters="filters" :counts="filterCounts" />
      
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CommunityNoteCard v-for="note in paginatedNotes" :key="note.listId" :note="note" />
      </div>
      
      <CommunityEmptyState v-if="paginatedNotes.length === 0" />

      <!-- 精致磨砂分页控制条 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-12 animate-fade-in">
        <button 
          @click="currentPage > 1 && (currentPage--, scrollToTop())" 
          :disabled="currentPage === 1"
          class="px-4 py-2 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-500 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95"
        >
          <ChevronLeft class="w-3.5 h-3.5" /> 上一页
        </button>
        
        <div class="flex items-center gap-1.5 mx-2">
          <button 
            v-for="page in totalPages" 
            :key="page" 
            @click="currentPage = page; scrollToTop()"
            :class="[
              'w-9 h-9 rounded-2xl text-xs font-black transition-all active:scale-95 flex items-center justify-center',
              currentPage === page 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' 
                : 'bg-white text-gray-400 hover:text-gray-700 border border-gray-100 hover:border-gray-300'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button 
          @click="currentPage < totalPages && (currentPage++, scrollToTop())" 
          :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-500 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95"
        >
          下一页 <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
    <CommunityUploadModal :isOpen="isUploadOpen" @close="isUploadOpen = false" @success="onUploadSuccess" />
  </div>
</template>
