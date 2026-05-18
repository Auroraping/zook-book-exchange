<script setup>
import { ref, onMounted, computed } from 'vue'
import CommunityEmptyState from '../components/CommunityEmptyState.vue'
import CommunityFilterBar from '../components/CommunityFilterBar.vue'
import CommunityHero from '../components/CommunityHero.vue'
import CommunityNoteCard from '../components/CommunityNoteCard.vue'

const notes = ref([])
const activeFilter = ref('')
const keyword = ref('')
const filters = ref([])
const courseGroups = ref({})

onMounted(async () => {
  const [notesRes, uiRes] = await Promise.all([fetch('/data/notes.json'), fetch('/data/ui.json')])
  const raw = await notesRes.json()
  const ui = await uiRes.json()
  notes.value = raw.map((note, index) => ({ ...note, listId: `${note.id}-${index}` }))
  filters.value = ui.community?.filters || []
  courseGroups.value = ui.community?.courseGroups || {}
  activeFilter.value = filters.value[0] || ''
})

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

const filterCounts = computed(() => {
  return filters.value.reduce((acc, filter) => {
    acc[filter] = notes.value.filter((note) => matchesFilter(note, filter)).length
    return acc
  }, {})
})
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <CommunityHero v-model:keyword="keyword" />
    <section class="flex flex-col gap-6">
      <CommunityFilterBar v-model:activeFilter="activeFilter" :filters="filters" :counts="filterCounts" />
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <CommunityNoteCard v-for="note in filteredNotes" :key="note.listId" :note="note" />
      </div>
      <CommunityEmptyState v-if="filteredNotes.length === 0" />
    </section>
  </div>
</template>
