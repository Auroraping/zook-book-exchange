<script setup>
import { computed } from 'vue'
import { MapPin, Clock } from 'lucide-vue-next'
import { useDataLoader } from '../composables/useDataLoader.js'

const props = defineProps({
  courses: { type: Array, required: true },
  selectedCourse: { type: Object, default: null }
})
const emit = defineEmits(['select'])
const { data: scheduleUi } = useDataLoader('/data/ui.json', (json) => json.schedule || {}, {})

const days = computed(() => scheduleUi.value.days || [])
const periodTimes = computed(() => scheduleUi.value.periodTimes || {})
const typeColors = computed(() => scheduleUi.value.typeColors || {})

// 智能寻址转换：计算该课程在 1-13 行坐标下的实际起点行 index (1-indexed)
const getRealStartPeriod = (c) => {
  let start = c.period
  const isMock = !String(c.id).startsWith('real_')
  if (isMock) {
    if (start === 5) start = 6   // 模拟坐标 5 -> 实际教务第 6 节 (13:25)
    if (start === 7) start = 8   // 模拟坐标 7 -> 实际教务第 8 节 (15:05)
  }
  return start
}

const isSelected = (course) => {
  return props.selectedCourse?.id === course?.id
}
</script>

<template>
  <div class="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-4">
    <!-- 主体 CSS Grid：共 8 列 (1时间列 + 7天列)，14行 (1表头行 + 13小节行) -->
    <div class="grid grid-cols-[50px_repeat(7,_1fr)] grid-rows-[45px_repeat(13,_minmax(52px,_auto))] border-t border-l border-gray-100 rounded-2xl overflow-hidden bg-gray-50/20">
      
      <!-- 表头：第一列空白，后面七列为星期 -->
      <div class="grid-row-1 grid-column-1 bg-gray-50/80 border-r border-b border-gray-100 flex items-center justify-center">
        <Clock class="w-4 h-4 text-gray-400" />
      </div>
      <div 
        v-for="(day, idx) in days" 
        :key="day" 
        :style="{ gridRow: 1, gridColumn: idx + 2 }"
        class="bg-gray-50/80 border-r border-b border-gray-100 flex flex-col items-center justify-center font-bold text-xs text-gray-600"
      >
        <span>{{ day }}</span>
      </div>

      <!-- 背景网格与左侧时间表 -->
      <template v-for="row in 13" :key="'row-' + row">
        <!-- 左侧第几节与具体时间 -->
        <div 
          :style="{ gridRow: row + 1, gridColumn: 1 }"
          class="bg-gray-50/60 border-r border-b border-gray-100 flex flex-col items-center justify-center py-1 text-center select-none"
        >
          <span class="text-[9px] text-gray-400 font-bold scale-90 leading-none">{{ periodTimes[row] }}</span>
          <span class="text-xs font-black text-gray-700 mt-1 leading-none">{{ row }}</span>
        </div>
        
        <!-- 空白背景方格 -->
        <div 
          v-for="col in 7" 
          :key="'cell-' + row + '-' + col"
          :style="{ gridRow: row + 1, gridColumn: col + 1 }"
          class="border-r border-b border-gray-100/70"
        ></div>
      </template>

      <!-- 浮动定位的课程卡片 (智能 CSS Grid 位置分配，实现完美垂直跨行跨节次拉伸) -->
      <button
        v-for="course in courses"
        :key="course.id"
        @click="emit('select', course)"
        :style="{
          gridRowStart: getRealStartPeriod(course) + 1,
          gridRowEnd: getRealStartPeriod(course) + 1 + (course.duration || 2),
          gridColumn: (course.day || 1) + 1
        }"
        :class="[
          'm-1 rounded-xl border-2 p-2 flex flex-col justify-between text-left transition-all hover:shadow-md hover:scale-[1.01] active:scale-95 z-10 overflow-hidden',
          isSelected(course) ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-[1.01] z-20' : '',
          typeColors[course.type] || 'bg-gray-50 border-gray-200 text-gray-700'
        ]"
      >
        <div class="flex flex-col justify-between h-full w-full gap-1">
          <div>
            <h4 class="text-[10px] font-black leading-tight text-gray-800 line-clamp-2">{{ course.name }}</h4>
            <p class="text-[8px] opacity-75 mt-0.5 truncate leading-tight font-medium">{{ course.location }}</p>
          </div>
          <!-- 仅当格子高度足够时显示周次，使版面更为清爽 -->
          <div v-if="(course.duration || 2) > 1" class="text-[8px] opacity-60 leading-none truncate font-bold">
            {{ course.weekText || (course.teacher) }}
          </div>
        </div>
      </button>

    </div>

    <!-- 图例 -->
    <div class="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-6 flex-wrap mt-4 rounded-2xl">
      <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-2">图例</span>
      <div v-for="(cls, label) in typeColors" :key="label" class="flex items-center gap-2">
        <div :class="['w-3 h-3 rounded border-2', cls]"></div>
        <span class="text-[10px] font-bold text-gray-500">{{ label }}</span>
      </div>
    </div>
  </div>
</template>
