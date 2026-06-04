<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { AlertCircle, Loader2 } from 'lucide-vue-next'
import { getJson, postJson } from '../composables/useApi.js'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import ScheduleBookList from '../components/ScheduleBookList.vue'
import SchedulePageHeader from '../components/SchedulePageHeader.vue'
import ScheduleTermToolbar from '../components/ScheduleTermToolbar.vue'
import ScheduleTextbookList from '../components/ScheduleTextbookList.vue'

const courses = ref([])
const books = ref([])
const selectedCourse = ref(null)
const loading = ref(false)
const error = ref('')
const isReal = ref(false)
const termInfo = ref(null)
const scheduleUi = ref({})

const officialTextbooks = ref([])
const officialTextbookStatus = ref('')

const hasOfficialBookDetail = (book) => {
  return book?.bookName && book.bookName !== '无教材' && book.bookName !== '暂无教材详情' && book.bookName !== '教材详情暂未填写'
}

// 获取真实的官方指定教材（仅提取真实爬取数据，绝不编造或硬编码，无法获取时老实交代）
const getRealOfficialBook = (courseName) => {
  if (!courseName) return null

  // 1. 优先使用教务系统实时预选抓取的数据 (比如在选书窗口期内)
  if (officialTextbooks.value && officialTextbooks.value.length > 0) {
    const match = officialTextbooks.value.find(ot => 
      courseName.includes(ot.courseName) || 
      ot.courseName.includes(courseName)
    )
    if (match) {
      if (!hasOfficialBookDetail(match)) return null
      return {
        ...match,
        source: '教务网实时预订'
      }
    }
  }

  // 2. 体育/定向越野等已知不需要教材的课程，物理判定为“无需教材”状态
  const cleanName = courseName.replace(/（[^）]+）/g, '').replace(/\([^)]+\)/g, '').trim();
  const isSports = (scheduleUi.value.sportsKeywords || []).some((keyword) => cleanName.includes(keyword))
  
  if (isSports) {
    return {
      courseName,
      bookName: '无教材',
      author: '无',
      press: '无',
      version: '无',
      status: '无需预订',
      source: '无需教材',
      orderTime: ''
    }
  }

  // 其他情况（如窗口关闭、接口返回 500 时）一律老老实实返回 null 表示无法获取，绝不无端编造数据
  return null
}

// 计算属性：当前选中课程的官方教材匹配项
const matchedOfficialTextbook = computed(() => {
  if (!selectedCourse.value) return null
  return getRealOfficialBook(selectedCourse.value.name)
})

onMounted(async () => {
  const [booksData, ui] = await Promise.all([getJson('/api/books?status=approved'), getJson('/api/ui')])
  books.value = booksData.books
  scheduleUi.value = ui.schedule || {}
  await loadSchedule()
})

// 1. 判断当前处于哪个大主学期 (春夏 或 秋冬)
const currentMainSemester = computed(() => {
  const month = new Date().getMonth() + 1
  if (month >= 2 && month <= 7) return '春夏'
  return '秋冬'
})

// 2. 根据主学期过滤课程：彻底滤掉另一个主学期 (如春夏时滤掉秋冬的课，反之亦然)，解决“显示历史课程”的问题
const currentTermCourses = computed(() => {
  const mainSem = currentMainSemester.value
  return courses.value.filter((c) => {
    // 优先匹配教务系统字段
    if (c.xxq) {
      if (mainSem === '春夏') {
        return c.xxq.includes('春') || c.xxq.includes('夏')
      } else {
        return c.xxq.includes('秋') || c.xxq.includes('冬')
      }
    }
    // 模拟数据兜底
    if (c.term) {
      return c.term.includes(mainSem)
    }
    return true
  })
})

const currentMiniSemester = computed(() => {
  const month = new Date().getMonth() + 1 // 1-12
  const date = new Date().getDate()
  
  if (currentMainSemester.value === '秋冬') {
    if (month >= 9 && month <= 11) {
      if (month === 11 && date >= 15) return '冬'
      return '秋'
    }
    if (month === 12 || month === 1) return '冬'
    return '秋'
  }
  
  if (month >= 2 && month <= 4) {
    if (month === 4 && date >= 24) return '夏'
    return '春'
  }
  if (month >= 5 && month <= 7) return '夏'
  
  return '春' // fallback
})

const selectedMiniSemester = ref(currentMiniSemester.value)
const currentView = ref('grid') // 'grid' (课表网格) 或 'list' (集体教材省钱清单)

// 匹配某门课程钦定的教务处官方教材
const getOfficialBook = (course) => {
  return getRealOfficialBook(course.name)
}

// 匹配某门课程在本平台出售中的二手教材列表
const getSecondhandBooks = (course) => {
  return books.value.filter(b => (course.bookIds || []).includes(b.id))
}

const loadSchedule = async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await postJson('/api/schedule', {})
    courses.value = data.courses || []
    termInfo.value = data.termInfo
    isReal.value = data.source === 'zju'
    officialTextbookStatus.value = isReal.value ? '已通过浙大统一身份认证同步真实课表' : '未认证用户当前展示模拟课表'
    if (data.raw) cacheZjuProfile(data.raw)
  } catch {
    courses.value = []
    error.value = '课表服务暂时不可用，请确认后端已启动后重试。'
    officialTextbookStatus.value = '课表数据必须从后端 SQLite 或浙大教务同步获取'
    isReal.value = false
  }
  loading.value = false
  selectedMiniSemester.value = currentMiniSemester.value
}

const cacheZjuProfile = (raw) => {
  if (raw.xm) localStorage.setItem('zook_real_name', raw.xm)
  if (raw.xh) localStorage.setItem('zook_student_id', raw.xh)
  if (raw.xy) localStorage.setItem('zook_college', raw.xy)
  if (raw.zy) localStorage.setItem('zook_major', raw.zy)
  if (raw.xzb) localStorage.setItem('zook_class', raw.xzb)
}

// 3. 动态短学期选项卡
const availableTabs = computed(() => {
  return scheduleUi.value.tabs?.[currentMainSemester.value] || []
})

// 从周次文本中提取所有的具体周数集合
const getWeekNumbers = (weekText, xxq) => {
  const weeks = new Set()
  if (!weekText) return weeks
  
  // 提取数字范围, 例如 "1-16", "9-16", "1-8"
  const rangeRegex = /(\d+)-(\d+)/g
  let match
  while ((match = rangeRegex.exec(weekText)) !== null) {
    const start = parseInt(match[1])
    const end = parseInt(match[2])
    for (let i = start; i <= end; i++) {
      weeks.add(i)
    }
  }
  
  // 提取单周数字
  const singleRegex = /\b(\d+)\b/g
  while ((match = singleRegex.exec(weekText)) !== null) {
    const w = parseInt(match[1])
    if (!weekText.includes(`${w}节`) && !weekText.includes(`${w}次`)) {
      weeks.add(w)
    }
  }

  // 夏学期或冬学期周次物理映射偏移
  const isSecondHalfTerm = (xxq && (xxq.includes('夏') || xxq.includes('冬')) && !xxq.includes('春夏') && !xxq.includes('秋冬')) || 
                           (weekText.includes('夏') && !weekText.includes('春夏')) || 
                           (weekText.includes('冬') && !weekText.includes('秋冬'))
  
  if (isSecondHalfTerm) {
    const list = Array.from(weeks)
    const allInFirstHalf = list.length > 0 && list.every(w => w >= 1 && w <= 8)
    if (allInFirstHalf) {
      weeks.clear()
      list.forEach(w => weeks.add(w + 8))
    }
  }

  // 全学期连读大课周次补全修正
  const isFullSemesterTerm = (xxq && (xxq.includes('春夏') || xxq.includes('秋冬'))) || 
                             weekText.includes('春夏') || 
                             weekText.includes('秋冬')
  if (isFullSemesterTerm) {
    const list = Array.from(weeks)
    const allInFirstHalf = list.length > 0 && list.every(w => w >= 1 && w <= 8)
    if (allInFirstHalf) {
      for (let w = 9; w <= 16; w++) {
        weeks.add(w)
      }
    }
  }
  
  return weeks
}

// 4. 精确短学期过滤
const filteredCourses = computed(() => {
  const activeMini = selectedMiniSemester.value
  
  const list = currentTermCourses.value.filter((c) => {
    const week = c.weekText || ''
    const courseWeeks = getWeekNumbers(week, c.xxq)
    
    if (courseWeeks.size === 0) {
      if (c.xxq) {
        return c.xxq.includes(activeMini)
      }
      return true
    }

    let isFirstHalf = activeMini === '春' || activeMini === '秋'
    let targetWeeks = isFirstHalf ? [1, 2, 3, 4, 5, 6, 7, 8] : [9, 10, 11, 12, 13, 14, 15, 16]

    return targetWeeks.some(w => courseWeeks.has(w))
  })

  // 合并连续节次
  const groups = {}
  for (const c of list) {
    const key = `${c.name}|${c.day}|${c.teacher}`
    if (!groups[key]) groups[key] = []
    groups[key].push(c)
  }

  const merged = []
  for (const key in groups) {
    const segments = groups[key]
    segments.sort((a, b) => parseInt(a.period) - parseInt(b.period))

    let current = null
    for (const item of segments) {
      const itemPeriod = parseInt(item.period)
      const itemDuration = parseInt(item.duration) || 2

      if (!current) {
        current = {
          ...item,
          period: itemPeriod,
          duration: itemDuration
        }
      } else {
        const currentEnd = current.period + current.duration - 1
        const nextStart = itemPeriod
        const nextEnd = itemPeriod + itemDuration - 1

        if (nextStart <= currentEnd + 1) {
          const newEnd = Math.max(currentEnd, nextEnd)
          current.duration = newEnd - current.period + 1
          
          if (item.weekText && current.weekText && current.weekText !== item.weekText && !current.weekText.includes(item.weekText)) {
            if (current.weekText.includes('节') && item.weekText.includes('节')) {
              current.weekText = `${current.period}-${newEnd}节`
            }
          }
        } else {
          merged.push(current)
          current = {
            ...item,
            period: itemPeriod,
            duration: itemDuration
          }
        }
      }
    }
    if (current) {
      merged.push(current)
    }
  }
  
  return merged
})

const addToCart = async (bookId) => {
  const cart = await postJson('/api/cart', { userId: 'me', bookId })
  localStorage.setItem('cart', JSON.stringify(cart.bookIds))
  window.dispatchEvent(new Event('cartUpdated'))
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <SchedulePageHeader :is-real="isReal" :loading="loading" :term-info="termInfo" @reload="loadSchedule" />
    <RouterLink v-if="!isReal" to="/profile" class="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors">
      未完成浙大统一身份认证，当前为模拟课表。前往个人中心认证后可一键导入真实课表。
    </RouterLink>
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
      <AlertCircle class="w-6 h-6 text-red-500 shrink-0" />
      <div class="flex-1">
        <h4 class="font-bold text-red-800">课表拉取失败</h4>
        <p class="text-sm text-red-600 mt-1">{{ error }}</p>
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-[32px] border border-gray-100 shadow-sm p-20 text-center">
      <Loader2 class="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
      <h3 class="text-xl font-black text-gray-800">正在从教务系统拉取课表...</h3>
      <p class="text-gray-500 mt-2">通过统一身份认证获取您的课程数据</p>
    </div>
    <template v-if="!loading">
      <ScheduleTermToolbar
        v-model:currentView="currentView"
        v-model:selectedMiniSemester="selectedMiniSemester"
        :tabs="availableTabs"
        :course-count="filteredCourses.length"
      />
      <template v-if="currentView === 'grid'">
        <ScheduleGrid
          :courses="filteredCourses"
          :selected-course="selectedCourse"
          @select="selectedCourse = $event"
        />
        <ScheduleBookList
          :selected-course="selectedCourse"
          :matched-books="books.filter((b) => (selectedCourse?.bookIds || []).includes(b.id))"
          :official-textbook="matchedOfficialTextbook"
          :textbook-status-message="officialTextbookStatus"
          @add-to-cart="addToCart"
          @close="selectedCourse = null"
        />
      </template>
      <ScheduleTextbookList v-else :courses="filteredCourses" :get-official-book="getOfficialBook" :get-secondhand-books="getSecondhandBooks" :textbook-status-message="officialTextbookStatus" @add-to-cart="addToCart" />
    </template>
  </div>
</template>
