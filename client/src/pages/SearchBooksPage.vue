<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SearchBookFilters from '../components/SearchBookFilters.vue'
import SearchBookResults from '../components/SearchBookResults.vue'
import SearchWishModal from '../components/SearchWishModal.vue'
import { getJson } from '../composables/useApi.js'

const activeSort = ref('')
const showWishModal = ref(false)
const selectedCampuses = ref([])
const selectedCategory = ref('')
const route = useRoute()
const books = ref([])
const campuses = ref([])
const sortTabs = ref([])
const categories = ref([])

onMounted(async () => {
  const [booksData, uiRes] = await Promise.all([getJson('/api/books?status=approved'), fetch('/data/ui.json')])
  const ui = await uiRes.json()
  books.value = booksData.books
  campuses.value = ui.search?.campuses || []
  sortTabs.value = ui.search?.sortTabs || []
  categories.value = ui.search?.categories || []
  activeSort.value = sortTabs.value[0] || ''
  selectedCategory.value = categories.value[0] || ''
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
}

const filteredBooks = computed(() => {
  let list = books.value.filter((b) => b.status === 'approved')
  const q = query.value.trim().toLowerCase()
  if (q) list = list.filter((b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
  if (selectedCampuses.value.length > 0) list = list.filter((b) => selectedCampuses.value.some((c) => c.includes(b.campus)))
  if (selectedCategory.value && selectedCategory.value !== categories.value[0]) list = list.filter((b) => b.category === selectedCategory.value)
  if (activeSort.value === sortTabs.value[1]) list = [...list].sort((a, b) => a.price - b.price)
  else if (activeSort.value === sortTabs.value[2]) list = [...list].sort((a, b) => (b.id > a.id ? 1 : -1))
  return list
})
</script>

<template>
  <div class="flex gap-16 items-start animate-google-in pt-4">
    <SearchBookFilters v-model:selectedCategory="selectedCategory" :campuses="campuses" :categories="categories" :selected-campuses="selectedCampuses" @reset="resetFilters" @toggle-campus="toggleCampus" @wish="showWishModal = true" />
    <SearchBookResults v-model:active-sort="activeSort" :books="filteredBooks" :sort-tabs="sortTabs" />
    <SearchWishModal :show="showWishModal" @close="showWishModal = false" />
  </div>
</template>
