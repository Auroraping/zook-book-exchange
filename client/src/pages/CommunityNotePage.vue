<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Download, Lock, ThumbsUp } from 'lucide-vue-next'
import { getJson, patchJson } from '../composables/useApi.js'

const route = useRoute()
const note = ref(null)

onMounted(async () => {
  note.value = (await getJson(`/api/notes/${route.params.id}`)).note
})

const recordAction = async (action) => {
  note.value = (await patchJson(`/api/notes/${note.value.id}`, { action })).note
  
  if (action === 'download') {
    if (note.value.fileUrl) {
      // 触发真实附件下载
      const link = document.createElement('a')
      link.href = note.value.fileUrl
      link.download = note.value.fileName || `${note.value.title}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      // 虚拟附件生成降级机制：如果数据库没有上传文件，当场拼装整篇笔记的详实内容生成 txt 供下载，拉满体验！
      let text = `========================================================================\n`
      text += `                  《${note.value.title}》考前复习讲义\n`
      text += `========================================================================\n\n`
      text += `【课程科目】：${note.value.course}\n`
      text += `【资料类型】：${note.value.type}\n`
      text += `【整理作者】：${note.value.author}\n`
      text += `【难度建议】：${note.value.difficulty}\n`
      text += `【更新时间】：${note.value.updatedAt}\n\n`
      text += `【资料概述】：\n${note.value.desc || '暂无概述说明。'}\n\n`
      text += `------------------------------------------------------------------------\n`
      text += `【章节大纲与复习概要】\n`
      text += `------------------------------------------------------------------------\n\n`
      
      if (note.value.sections && note.value.sections.length > 0) {
        note.value.sections.forEach((sec, idx) => {
          text += `${idx + 1}. 【${sec.heading}】\n`
          text += `   ${sec.body}\n\n`
        })
      } else {
        text += `   （本篇复习资料未录入细分章节，请直接查阅附件大纲。）\n\n`
      }
      
      text += `========================================================================\n`
      text += `     浙里淘书 zook 知识社区 · 好书淘不尽，浙里 top three · 知识共创\n`
      text += `========================================================================\n`
      
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${note.value.title}_复习参考.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }
}
</script>

<template>
  <div v-if="note" class="max-w-4xl mx-auto flex flex-col gap-8 animate-google-in">
    <RouterLink to="/community" class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-blue-600 w-fit"><ArrowLeft class="w-4 h-4" /> 返回知识社区</RouterLink>
    <article class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
      <div class="px-10 py-9 border-b border-gray-100 bg-blue-50/40">
        <div class="flex flex-wrap gap-2 mb-5"><span class="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full">{{ note.course }}</span><span class="bg-white text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-100">{{ note.type }}</span><span v-if="note.isPaid" class="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1"><Lock class="w-3 h-3" /> 积分兑换</span></div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-tight">{{ note.title }}</h1>
        <p class="text-gray-500 mt-4 leading-relaxed">{{ note.desc }}</p>
      </div>
      <div class="p-10 flex flex-col gap-7">
        <section v-for="section in note.sections" :key="section.heading" class="rounded-3xl border border-gray-100 bg-gray-50/60 p-6"><h2 class="text-lg font-black text-gray-900 mb-3">{{ section.heading }}</h2><p class="text-sm text-gray-600 leading-7">{{ section.body }}</p></section>
      </div>
      <div class="px-10 py-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs font-black text-gray-400">
        <span>作者：{{ note.author }} · 更新：{{ note.updatedAt }} · {{ note.difficulty }}</span>
        <span class="flex items-center gap-4"><button @click="recordAction('like')" class="flex items-center gap-1 hover:text-blue-600"><ThumbsUp class="w-4 h-4" /> {{ note.likes }}</button><button @click="recordAction('download')" class="flex items-center gap-1 hover:text-blue-600"><Download class="w-4 h-4" /> {{ note.downloads }}</button></span>
      </div>
    </article>
  </div>
</template>
