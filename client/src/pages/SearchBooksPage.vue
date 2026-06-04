<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SearchBookFilters from '../components/SearchBookFilters.vue'
import SearchBookResults from '../components/SearchBookResults.vue'
import SearchWishModal from '../components/SearchWishModal.vue'
import { getJson } from '../composables/useApi.js'

const activeSort = ref('')
const sortOrder = ref('desc') // 'asc' or 'desc'
const showWishModal = ref(false)
const selectedCampuses = ref([])
const selectedCategory = ref('')
const route = useRoute()
const books = ref([])
const campuses = ref([])
const sortTabs = ref([])
const categories = ref([])

onMounted(async () => {
  const [booksData, ui] = await Promise.all([getJson('/api/books?status=approved'), getJson('/api/ui')])
  books.value = booksData.books
  campuses.value = ui.search?.campuses || []
  sortTabs.value = ui.search?.sortTabs || []
  categories.value = ui.search?.categories || []
  activeSort.value = sortTabs.value[0] || ''
  selectedCategory.value = categories.value[0] || ''
  sortOrder.value = 'desc' // "综合" 默认降序
})

const query = computed(() => route.query.q || '')

const toggleCampus = (campus) => {
  const idx = selectedCampuses.value.indexOf(campus)
  if (idx >= 0) selectedCampuses.value.splice(idx, 1)
  else selectedCampuses.value.push(campus)
}

const resetFilters = () => {
  selectedCampuses.value = []
  selectedCategory.value = categories.value[0] || ''
  activeSort.value = sortTabs.value[0] || ''
  sortOrder.value = 'desc'
}

const handleSortChange = (tab) => {
  if (activeSort.value === tab) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    activeSort.value = tab
    if (tab === sortTabs.value[1]) {
      sortOrder.value = 'asc' // 价格首次点击默认为低到高（升序）
    } else {
      sortOrder.value = 'desc' // 综合、最新、成色首次点击默认为高到低（降序）
    }
  }
}

const getConditionScore = (condition) => {
  const cond = (condition || '').toLowerCase()
  if (cond.includes('全新未拆封') || cond.includes('全新')) return 10
  if (cond.includes('9.9') || cond.includes('99新')) return 9.9
  if (cond.includes('9.5') || cond.includes('95新')) return 9.5
  if (cond.includes('9') || cond.includes('90新')) return 9
  if (cond.includes('8.5') || cond.includes('85新')) return 8.5
  if (cond.includes('8') || cond.includes('80新')) return 8
  if (cond.includes('7.5') || cond.includes('75新')) return 7.5
  if (cond.includes('7') || cond.includes('70新')) return 7
  return 5
}

const filteredBooks = computed(() => {
  let list = books.value.filter((b) => b.status === 'approved')
  const q = query.value.trim().toLowerCase()
  if (q) list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
  if (selectedCampuses.value.length > 0) list = list.filter((b) => selectedCampuses.value.some((c) => c.includes(b.campus)))
  if (selectedCategory.value && selectedCategory.value !== categories.value[0]) list = list.filter((b) => b.category === selectedCategory.value)
  
  // 1. 综合排序 (按 AI Score)
  if (activeSort.value === sortTabs.value[0]) {
    list = [...list].sort((a, b) => {
      const scoreA = a.aiScore || 80
      const scoreB = b.aiScore || 80
      return sortOrder.value === 'asc' ? scoreA - scoreB : scoreB - scoreA
    })
  }
  // 2. 价格排序
  else if (activeSort.value === sortTabs.value[1]) {
    list = [...list].sort((a, b) => {
      return sortOrder.value === 'asc' ? a.price - b.price : b.price - a.price
    })
  }
  // 3. 最新发布 (按 id 字符顺序)
  else if (activeSort.value === sortTabs.value[2]) {
    list = [...list].sort((a, b) => {
      const comp = b.id.localeCompare(a.id)
      return sortOrder.value === 'asc' ? -comp : comp
    })
  }
  // 4. 成色排序
  else if (activeSort.value === sortTabs.value[3]) {
    list = [...list].sort((a, b) => {
      const scoreA = getConditionScore(a.condition)
      const scoreB = getConditionScore(b.condition)
      return sortOrder.value === 'asc' ? scoreA - scoreB : scoreB - scoreA
    })
  }
  
  return list
})
</script>

<template>
  <div class="flex gap-16 items-start animate-google-in pt-4">
    <SearchBookFilters v-model:selectedCategory="selectedCategory" :campuses="campuses" :categories="categories" :selected-campuses="selectedCampuses" @reset="resetFilters" @toggle-campus="toggleCampus" @wish="showWishModal = true" />
    <SearchBookResults :active-sort="activeSort" :sort-order="sortOrder" :books="filteredBooks" :sort-tabs="sortTabs" @sort-change="handleSortChange" />
    <SearchWishModal :show="showWishModal" @close="showWishModal = false" />
  </div>
</template>
