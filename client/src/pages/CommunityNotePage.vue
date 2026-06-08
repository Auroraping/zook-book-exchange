<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Download, Lock, ThumbsUp } from 'lucide-vue-next'
import { getJson, patchJson, postJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'
import { useCurrentAccount } from '../composables/useCurrentAccount.js'

const route = useRoute()
const note = ref(null)
const commentText = ref('')
const isSubmittingComment = ref(false)
const { updateUser } = useAuth()
const { user, accountId } = useCurrentAccount()

onMounted(async () => {
  note.value = (await getJson(`/api/notes/${route.params.id}`)).note
})

const downloadVirtualNote = () => {
  let text = `《${note.value.title}》复习参考\n\n`
  text += `课程：${note.value.course}\n类型：${note.value.type}\n作者：${note.value.author}\n\n`
  text += `${note.value.desc || '暂无概述说明。'}\n\n`
  ;(note.value.sections || []).forEach((section, index) => {
    text += `${index + 1}. ${section.heading}\n${section.body}\n\n`
  })
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

const recordAction = async (action) => {
  const points = Number(note.value.pointsRequired || 0)
  const isAuthor = String(note.value.userId || 'me') === String(accountId.value)
  if (action === 'download' && points > 0 && !isAuthor) {
    if ((user.value?.points || 0) < points) {
      alert(`积分不足。下载本篇资料需要 ${points} 积分，您当前有 ${user.value?.points || 0} 积分。`)
      return
    }
    if (!confirm(`下载将消耗 ${points} 积分，确定兑换吗？`)) return
  }
  try {
    const res = await patchJson(`/api/notes/${note.value.id}`, { action, userId: accountId.value })
    note.value = res.note
    if (action === 'download') {
      if (points > 0 && !isAuthor) updateUser({ points: (user.value?.points || 0) - points })
      if (note.value.fileUrl) {
        const link = document.createElement('a')
        link.href = note.value.fileUrl
        link.download = note.value.fileName || `${note.value.title}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        downloadVirtualNote()
      }
    }
  } catch (err) {
    alert(err.message || '操作失败，请重试')
  }
}

const submitComment = async () => {
  if (!commentText.value.trim()) return
  isSubmittingComment.value = true
  try {
    const res = await postJson(`/api/notes/${note.value.id}/comments`, {
      userId: accountId.value,
      author: user.value?.name || '浙大同学',
      content: commentText.value.trim()
    })
    note.value.comments = res.note.comments
    commentText.value = ''
  } catch (err) {
    alert(err.message || '发表评论失败')
  } finally {
    isSubmittingComment.value = false
  }
}
</script>

<template>
  <div v-if="note" class="max-w-4xl mx-auto flex flex-col gap-8 animate-google-in pb-12">
    <RouterLink to="/community" class="inline-flex items-center gap-2 text-sm font-black text-gray-500 hover:text-blue-600 w-fit"><ArrowLeft class="w-4 h-4" /> 返回知识社区</RouterLink>
    <article class="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
      <div class="px-10 py-9 border-b border-gray-100 bg-blue-50/40">
        <div class="flex flex-wrap gap-2 mb-5"><span class="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full">{{ note.course }}</span><span class="bg-white text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-slate-100">{{ note.type }}</span><span v-if="note.pointsRequired > 0" class="bg-orange-50 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-orange-100 flex items-center gap-1"><Lock class="w-3 h-3" /> {{ note.pointsRequired }} 积分兑换</span></div>
        <h1 class="text-4xl font-black text-gray-900 tracking-tight leading-tight">{{ note.title }}</h1>
        <p class="text-gray-500 mt-4 leading-relaxed">{{ note.desc }}</p>
      </div>
      <div class="p-10 flex flex-col gap-7">
        <section v-for="section in note.sections" :key="section.heading" class="rounded-3xl border border-gray-100 bg-gray-50/60 p-6">
          <h2 class="text-lg font-black text-gray-900 mb-3">{{ section.heading }}</h2>
          <div class="text-sm text-gray-650 leading-7 rich-content" v-html="section.body"></div>
        </section>
      </div>
      <div class="px-10 py-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-xs font-black text-gray-400">
        <span>作者：{{ note.author }} · 更新：{{ note.updatedAt }} · {{ note.difficulty }}</span>
        <span class="flex items-center gap-4">
          <button @click="recordAction('like')" class="flex items-center gap-1 hover:text-blue-600"><ThumbsUp class="w-4 h-4" /> {{ note.likes }}</button>
          <button @click="recordAction('download')" class="flex items-center gap-1 hover:text-blue-600"><Download class="w-4 h-4" /> {{ note.downloads }}</button>
        </span>
      </div>
    </article>

    <div class="bg-white border border-gray-100 rounded-[32px] shadow-sm p-10 flex flex-col gap-6">
      <div class="flex items-center justify-between border-b border-gray-50 pb-5"><h3 class="text-xl font-black text-gray-900">讨论与评论 <span class="bg-blue-50 text-blue-600 text-xs font-black px-2.5 py-1 rounded-lg">{{ note.comments?.length || 0 }}</span></h3></div>
      <div v-if="note.comments && note.comments.length > 0" class="flex flex-col gap-5 max-h-[400px] overflow-y-auto pr-2">
        <div v-for="c in note.comments" :key="c.id" class="p-5 bg-slate-50/50 rounded-2xl border border-gray-100/50 flex gap-4">
          <img :src="`https://api.dicebear.com/7.x/identicon/svg?seed=${c.author}`" class="w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm object-cover" />
          <div class="flex-1 min-w-0"><div class="flex justify-between items-center mb-1"><span class="font-bold text-xs text-gray-700">{{ c.author }}</span><span class="text-[10px] text-gray-400 font-bold">{{ c.createdAt }}</span></div><p class="text-xs text-gray-650 leading-relaxed">{{ c.content }}</p></div>
        </div>
      </div>
      <div v-else class="py-8 text-center text-xs text-gray-400 font-bold">暂无讨论，快来发表第一条评论。</div>
      <div class="flex gap-4 items-start border-t border-gray-50 pt-6">
        <img :src="user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'" class="w-10 h-10 rounded-full border border-gray-100 bg-white shadow-sm object-cover" />
        <div class="flex-1 flex flex-col gap-3">
          <textarea v-model="commentText" placeholder="写下你的想法或对资料的反馈..." rows="2" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs font-medium transition-colors resize-none outline-none"></textarea>
          <button @click="submitComment" :disabled="isSubmittingComment || !commentText.trim()" class="self-end px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold disabled:opacity-50">{{ isSubmittingComment ? '提交中...' : '发表评论' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rich-content :deep(img) { max-width: 100%; height: auto; border-radius: 16px; margin: 1.5rem auto; display: block; }
.rich-content :deep(a) { color: #2563eb; font-weight: 700; text-decoration: none; }
.rich-content :deep(a:hover) { color: #1d4ed8; text-decoration: underline; }
.rich-content :deep(article) { white-space: pre-wrap; word-break: break-word; }
</style>
