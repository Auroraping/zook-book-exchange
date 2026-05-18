<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { CalendarDays, BookOpen, MapPin, User, Sparkles, ShoppingBag, RefreshCw, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-vue-next'
import { useAuth } from '../composables/useAuth.js'
import ScheduleGrid from '../components/ScheduleGrid.vue'
import ScheduleBookList from '../components/ScheduleBookList.vue'

const { user, isLoggedIn } = useAuth()
const courses = ref([])
const books = ref([])
const selectedCourse = ref(null)
const loading = ref(false)
const error = ref('')
const isReal = ref(false)
const termInfo = ref(null)

const officialTextbooks = ref([])

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
      return {
        ...match,
        source: '教务网实时预订'
      }
    }
  }

  // 2. 体育/定向越野等已知不需要教材的课程，物理判定为“无需教材”状态
  const cleanName = courseName.replace(/（[^）]+）/g, '').replace(/\([^)]+\)/g, '').trim();
  const isSports = cleanName.includes('跆拳道') || 
                   cleanName.includes('定向越野') || 
                   cleanName.includes('体育') || 
                   cleanName.includes('太极') || 
                   cleanName.includes('游泳') || 
                   cleanName.includes('羽毛球') || 
                   cleanName.includes('网球') || 
                   cleanName.includes('乒乓球') || 
                   cleanName.includes('篮球') || 
                   cleanName.includes('足球');
  
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
  const booksRes = await fetch('/data/books.json')
  books.value = await booksRes.json()
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
  // 尝试从后端拉取真实课表
  const username = localStorage.getItem('zook_username')
  const password = localStorage.getItem('zook_password')
  if (username && password) {
    try {
      const res = await fetch('http://localhost:3001/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success && data.courses && data.courses.length > 0) {
        // 核心智能同步：将拉取到的真实浙大个人信息保存到 localStorage 中，以供全站个人中心动态展示
        if (data.raw) {
          if (data.raw.xm) localStorage.setItem('zook_real_name', data.raw.xm)
          if (data.raw.xh) localStorage.setItem('zook_student_id', data.raw.xh)
          if (data.raw.xy) localStorage.setItem('zook_college', data.raw.xy)
          if (data.raw.zy) localStorage.setItem('zook_major', data.raw.zy)
          if (data.raw.xzb) localStorage.setItem('zook_class', data.raw.xzb)
        }

        courses.value = data.courses
        termInfo.value = data.termInfo
        isReal.value = true

        // 同时静默同步官方教材预定状态来进行一键比价匹配
        try {
          const tbRes = await fetch('http://localhost:3001/api/textbooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          })
          const tbData = await tbRes.json()
          if (tbData.success && tbData.textbooks) {
            officialTextbooks.value = tbData.textbooks
            console.log('[Schedule] 成功从教务网实时抓取并解析到 ' + tbData.textbooks.length + ' 本官方教材');
          }
        } catch (e) {
          console.warn('[Schedule] 静默抓取官方教材预订失败:', e.message)
        }

        loading.value = false
        // 自动高亮当前所在的短学期
        selectedMiniSemester.value = currentMiniSemester.value
        return
      }
    } catch (e) {
      console.warn('[Schedule] 后端不可用，使用模拟数据:', e.message)
    }
  }
  // 降级到本地模拟数据
  const localRes = await fetch('/data/courses.json')
  courses.value = await localRes.json()
  isReal.value = false
  loading.value = false
  selectedMiniSemester.value = currentMiniSemester.value
}

// 3. 动态短学期选项卡
const availableTabs = computed(() => {
  if (currentMainSemester.value === '秋冬') {
    return [
      { id: '秋', name: '秋学期' },
      { id: '冬', name: '冬学期' }
    ]
  }
  return [
    { id: '春', name: '春学期' },
    { id: '夏', name: '夏学期' }
  ]
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

const addToCart = (bookId) => {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]')
  if (!cart.includes(bookId)) {
    localStorage.setItem('cart', JSON.stringify([...cart, bookId]))
    window.dispatchEvent(new Event('cartUpdated'))
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col gap-8 animate-google-in">
    <!-- 头部 -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div>
        <div class="flex items-center gap-3 mb-3">
          <div class="w-12 h-[2px] bg-blue-600"></div>
          <span class="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Schedule Sync</span>
        </div>
        <h1 class="text-5xl font-black text-gray-900 tracking-tight">课表智能选书</h1>
        <p class="text-gray-500 mt-3 text-lg">绑定本学期课表，同步所需教材。</p>
      </div>
      <div class="flex items-center gap-4">
        <!-- 数据来源标识 -->
        <div :class="['rounded-2xl border px-5 py-3 flex items-center gap-3 text-sm font-bold', isReal ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700']">
          <div :class="['w-2 h-2 rounded-full', isReal ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500']"></div>
          {{ isReal ? '教务系统实时数据' : '本地模拟数据' }}
          <span v-if="termInfo" class="text-xs opacity-70">{{ termInfo.year }} {{ termInfo.semester }}</span>
        </div>
        <button @click="loadSchedule" :disabled="loading" class="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-50">
          <Loader2 v-if="loading" class="w-5 h-5 animate-spin" />
          <RefreshCw v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-center gap-4">
      <AlertCircle class="w-6 h-6 text-red-500 shrink-0" />
      <div class="flex-1">
        <h4 class="font-bold text-red-800">课表拉取失败</h4>
        <p class="text-sm text-red-600 mt-1">{{ error }}</p>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="bg-white rounded-[32px] border border-gray-100 shadow-sm p-20 text-center">
      <Loader2 class="w-12 h-12 text-blue-500 animate-spin mx-auto mb-6" />
      <h3 class="text-xl font-black text-gray-800">正在从教务系统拉取课表...</h3>
      <p class="text-gray-500 mt-2">通过统一身份认证获取您的课程数据</p>
    </div>

    <!-- 课程表及短学期选项 -->
    <template v-if="!loading">
      <!-- 精美短学期切换及网格/列表视图切换 -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 p-3 rounded-[24px] shadow-sm">
        <div class="flex items-center gap-2">
          <button 
            v-for="tab in availableTabs" 
            :key="tab.id"
            @click="selectedMiniSemester = tab.id"
            :class="['px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-200', selectedMiniSemester === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50']"
          >
            {{ tab.name }}
          </button>
        </div>

        <div class="flex items-center gap-4">
          <div class="text-xs font-bold text-gray-400 hidden md:block">
            当前学期已加载 <span class="text-blue-600 font-black text-sm">{{ filteredCourses.length }}</span> 门课程
          </div>

          <!-- 视图切换面板 -->
          <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/40">
            <button 
              @click="currentView = 'grid'"
              :class="['px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 duration-300', currentView === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
            >
              <CalendarDays class="w-4 h-4" /> 📅 课表网格视图
            </button>
            <button 
              @click="currentView = 'list'"
              :class="['px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 duration-300', currentView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
            >
              <BookOpen class="w-4 h-4" /> 📚 教材指定清单
            </button>
          </div>
        </div>
      </div>

      <!-- 网格视图 -->
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
          @add-to-cart="addToCart"
          @close="selectedCourse = null"
        />
      </template>

      <!-- 📚 官方教材清单 (集体展示视图) -->
      <template v-else>
        <!-- 集体教材列表 -->
        <div class="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 flex flex-col gap-6 mt-4">
          <div class="flex items-center justify-between pb-4 border-b border-gray-100">
            <h3 class="text-base font-black text-gray-900 flex items-center gap-2">
              <Sparkles class="w-5 h-5 text-blue-600" /> 本学期全部课程教材对照表
            </h3>
            <span class="text-xs font-bold text-gray-400">教务官方教材与在售情况</span>
          </div>

          <div class="divide-y divide-gray-100">
            <div 
              v-for="course in filteredCourses" 
              :key="course.id" 
              class="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/40 px-4 -mx-4 rounded-2xl transition-colors group"
            >
              <!-- 课程基础信息 -->
              <div class="flex items-start gap-4 md:w-1/4 shrink-0">
                <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {{ course.name.slice(0, 2) }}
                </div>
                <div>
                  <h4 class="font-extrabold text-gray-900 text-sm group-hover:text-blue-600 transition-colors">{{ course.name }}</h4>
                  <p class="text-[10px] text-gray-400 mt-1 font-bold">教师: {{ course.teacher }} · {{ course.type || '专业课' }}</p>
                </div>
              </div>

              <!-- 官方指定教材栏 -->
              <div class="flex-1 min-w-0 md:px-4">
                <!-- 状态 A：有爬取到的官方教材 -->
                <div v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材'" class="flex items-center gap-3">
                  <div class="min-w-0">
                    <span class="text-xs font-extrabold text-gray-400">官方指定：</span>
                    <span class="text-xs font-extrabold text-gray-900">《{{ getOfficialBook(course).bookName }}》</span>
                    <p class="text-[10px] text-gray-400 mt-0.5 truncate" v-if="getOfficialBook(course).author !== '暂无' && getOfficialBook(course).author !== '无'">
                      作者: {{ getOfficialBook(course).author }} · 第 {{ getOfficialBook(course).version }} 版
                    </p>
                  </div>
                </div>
                <!-- 状态 B：明确无需教材 (体育课) -->
                <div v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'" class="flex items-center gap-2 text-slate-400">
                  <CheckCircle2 class="w-4 h-4 text-emerald-500" />
                  <span class="text-xs font-extrabold text-slate-500">官方提示：本课程无需使用教材</span>
                </div>
                <!-- 状态 C：教务系统没有数据/未预订 (由于接口关闭) -->
                <div v-else class="flex items-center gap-2 text-slate-400">
                  <Info class="w-4 h-4 text-slate-400" />
                  <span class="text-xs font-extrabold text-slate-400">教务接口已关闭，当前无法爬取教材信息</span>
                </div>
              </div>

              <!-- 二手书匹配与加购动作 -->
              <div class="md:w-1/3 shrink-0 flex items-center justify-between md:justify-end gap-6">
                <!-- 二手书价格比对 -->
                <div class="text-left md:text-right min-w-[120px]">
                  <template v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材'">
                    <div v-if="getSecondhandBooks(course).length > 0">
                      <div class="flex items-baseline md:justify-end gap-1">
                        <span class="text-xs font-bold text-emerald-600">二手最低</span>
                        <span class="text-lg font-black text-emerald-600">¥{{ Math.min(...getSecondhandBooks(course).map(b => b.price)) }}</span>
                      </div>
                    </div>
                    <div v-else>
                      <span class="text-xs font-extrabold text-slate-400 block">暂无二手在售</span>
                    </div>
                  </template>
                  <template v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'">
                    <span class="text-xs font-extrabold text-slate-500 block">🌸 无需教材</span>
                  </template>
                  <template v-else>
                    <span class="text-xs font-extrabold text-slate-400 block">教务无数据</span>
                  </template>
                </div>

                <!-- 动作按钮 -->
                <div class="shrink-0">
                  <template v-if="getOfficialBook(course) && getOfficialBook(course).bookName !== '无教材'">
                    <button 
                      v-if="getSecondhandBooks(course).length > 0"
                      @click="addToCart(getSecondhandBooks(course).sort((a,b) => a.price - b.price)[0].id)" 
                      class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-100 active:scale-95 transition-all flex items-center gap-1 duration-300"
                    >
                      <ShoppingBag class="w-3.5 h-3.5" /> 一键淘书
                    </button>
                    <span v-else class="text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl block">
                      暂无二手
                    </span>
                  </template>
                  <span v-else-if="getOfficialBook(course) && getOfficialBook(course).bookName === '无教材'" class="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl block">
                    无需教材
                  </span>
                  <span v-else class="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl block">
                    无法爬取
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>
