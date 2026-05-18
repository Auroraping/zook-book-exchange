<script setup>
import ScheduleCourseEmptyState from './ScheduleCourseEmptyState.vue'
import ScheduleCoursePanelHeader from './ScheduleCoursePanelHeader.vue'
import ScheduleMatchedBooks from './ScheduleMatchedBooks.vue'
import ScheduleOfficialTextbookCard from './ScheduleOfficialTextbookCard.vue'

const props = defineProps({
  selectedCourse: { type: Object, default: null },
  matchedBooks: { type: Array, required: true },
  officialTextbook: { type: Object, default: null },
  textbookStatusMessage: { type: String, default: '' }
})
const emit = defineEmits(['addToCart', 'close'])
</script>

<template>
  <div v-if="selectedCourse" class="bg-white rounded-[32px] border border-blue-100 shadow-sm p-8 animate-google-in">
    <ScheduleCoursePanelHeader :course="selectedCourse" @close="emit('close')" />
    <ScheduleOfficialTextbookCard :textbook="officialTextbook" :status-message="textbookStatusMessage" />
    <ScheduleMatchedBooks :books="matchedBooks" @add-to-cart="emit('addToCart', $event)" />
  </div>
  <ScheduleCourseEmptyState v-else />
</template>
