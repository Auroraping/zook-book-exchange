<script setup>
import { RouterLink } from 'vue-router'
import { BookOpen, MapPin, User, ShoppingBag, X, ChevronRight, Info } from 'lucide-vue-next'

const props = defineProps({
  selectedCourse: { type: Object, default: null },
  matchedBooks: { type: Array, required: true },
  officialTextbook: { type: Object, default: null }
})
const emit = defineEmits(['addToCart', 'close'])
</script>

<template>
  <div v-if="selectedCourse" class="bg-white rounded-[32px] border border-blue-100 shadow-sm p-8 animate-google-in">
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <BookOpen class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-2xl font-black text-gray-900">{{ selectedCourse.name }}</h3>
          <div class="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span class="flex items-center gap-1"><User class="w-4 h-4" /> {{ selectedCourse.teacher }}</span>
            <span class="flex items-center gap-1"><MapPin class="w-4 h-4" /> {{ selectedCourse.location }}</span>
          </div>
        </div>
      </div>
      <button @click="emit('close')" class="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- 教务官方指定教材卡 -->
    <div v-if="officialTextbook" class="mb-8 p-6 rounded-3xl border border-slate-200 bg-slate-50 text-slate-800">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-2xl bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <BookOpen class="w-6 h-6" />
        </div>
        
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h4 class="text-base font-extrabold flex items-center gap-2">
              教务官方指定教材
              <span class="text-[10px] px-2.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-800 border border-blue-200/40">
                {{ officialTextbook.status || '教务预订' }}
              </span>
            </h4>
            <span class="text-[10px] font-bold text-gray-400" v-if="officialTextbook.source">数据源：{{ officialTextbook.source }}</span>
          </div>

          <!-- 教材具体细节 -->
          <div class="mt-3 p-4 bg-white rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div class="min-w-0">
              <p class="font-extrabold text-gray-900 truncate text-sm">{{ officialTextbook.bookName }}</p>
              <p class="text-[10px] text-gray-400 mt-1 truncate" v-if="officialTextbook.bookName !== '无教材'">
                作者：{{ officialTextbook.author }} · 出版社：{{ officialTextbook.press }} · 版本：第 {{ officialTextbook.version }} 版
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态 C：教务系统没有数据（老老实实告诉用户技术上无法爬取） -->
    <div v-else class="mb-8 p-6 rounded-3xl border border-slate-200 bg-slate-50 text-slate-800">
      <div class="flex items-start gap-4">
        <div class="w-12 h-12 rounded-2xl bg-white text-gray-400 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
          <Info class="w-6 h-6 text-slate-400" />
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-base font-extrabold text-slate-700">官方指定教材：暂无数据</h4>
          <div class="mt-3 p-4 bg-white rounded-2xl border border-slate-100 text-xs font-bold text-slate-500 leading-relaxed">
            ⚠️ <strong>教务教材同步提示：</strong><br>
            目前浙大本科生教务网的教材预订页面处于关闭状态（接口返回 500 运行异常）。因此在技术上，平台当前无法为您爬取和同步该课程真实的官方预订教材名称。
          </div>
        </div>
      </div>
    </div>

    <!-- 匹配到的在售二手书 -->
    <div v-if="matchedBooks.length > 0">
      <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">匹配到 {{ matchedBooks.length }} 本教材</h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div v-for="book in matchedBooks" :key="book.id" class="flex gap-5 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group">
          <RouterLink :to="`/book/${book.id}`" class="shrink-0">
            <img :src="book.cover" :alt="book.title" class="w-20 h-28 object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
          </RouterLink>
          <div class="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <RouterLink :to="`/book/${book.id}`" class="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2 block">{{ book.title }}</RouterLink>
              <p class="text-xs text-gray-400 mt-1">{{ book.author }} · {{ book.condition }}</p>
            </div>
            <div class="flex items-end justify-between mt-3">
              <div>
                <span class="text-2xl font-black text-gray-900">¥{{ book.price }}</span>
                <span class="text-sm text-gray-400 line-through ml-2">¥{{ book.originalPrice }}</span>
              </div>
              <button @click="emit('addToCart', book.id)" class="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-200">
                <ShoppingBag class="w-4 h-4" /> 加入清单
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center py-12 px-8 bg-slate-50/50 rounded-[28px] border-2 border-dashed border-slate-200/70">
      <div class="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-300 mx-auto mb-4 shadow-sm">
        <BookOpen class="w-6 h-6" />
      </div>
      <h5 class="text-sm font-extrabold text-gray-800">
        在售二手教材：暂无匹配
      </h5>
      <p class="text-xs text-gray-400 mt-3 max-w-sm mx-auto leading-relaxed">
        目前本站暂无同学上架这门课程的书籍。您可以发布求购心愿或过几天再来查看。
      </p>
    </div>
  </div>
  <!-- 未选课程的提示 -->
  <div v-else class="bg-slate-50 rounded-[32px] border border-slate-200/60 p-12 text-center">
    <BookOpen class="w-12 h-12 text-slate-400 mx-auto mb-4" />
    <h3 class="text-xl font-black text-gray-800 mb-2">点击课程表中的课程</h3>
    <p class="text-gray-500 max-w-md mx-auto">选择一门课程后，系统将展示本门课程的官方指定教材及在售二手书信息。</p>
  </div>
</template>
