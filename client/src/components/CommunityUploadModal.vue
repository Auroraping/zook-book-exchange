<script setup>
import { ref } from 'vue'
import { X, Upload, File, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { uploadFile } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'

const { user } = useAuth()

const props = defineProps({
  isOpen: { type: Boolean, required: true }
})
const emit = defineEmits(['close', 'success'])

const title = ref('')
const course = ref('')
const type = ref('课程笔记')
const difficulty = ref('基础夯实')
const isPaid = ref(false)
const desc = ref('')
const tags = ref('')
const file = ref(null)
const fileName = ref('')
const fileSize = ref('')

const isDragging = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const showSuccess = ref(false)

const types = ['课程笔记', '模拟试卷', '高频题型', '复习提纲', '答题模板']
const difficulties = ['基础夯实', '考试核心', '冲刺提高', '考前速记']

// 选择文件
const onFileChange = (e) => {
  const selected = e.target.files[0]
  if (selected) {
    file.value = selected
    fileName.value = selected.name
    fileSize.value = (selected.size / 1024).toFixed(1) + ' KB'
  }
}

// 拖拽文件
const onDragOver = (e) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e) => {
  e.preventDefault()
  isDragging.value = false
  const selected = e.dataTransfer.files[0]
  if (selected) {
    file.value = selected
    fileName.value = selected.name
    fileSize.value = (selected.size / 1024).toFixed(1) + ' KB'
  }
}

// 移除文件
const removeFile = () => {
  file.value = null
  fileName.value = ''
  fileSize.value = ''
}

// 提交表单
const handleSubmit = async () => {
  if (!title.value.trim()) {
    submitError.value = '请填写笔记标题'
    return
  }
  if (!course.value.trim()) {
    submitError.value = '请填写关联课程'
    return
  }
  if (!file.value) {
    submitError.value = '请上传附件文件'
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    const formData = new FormData()
    formData.append('title', title.value.trim())
    formData.append('course', course.value.trim())
    formData.append('type', type.value)
    formData.append('difficulty', difficulty.value)
    formData.append('isPaid', String(isPaid.value))
    formData.append('desc', desc.value.trim())
    formData.append('tags', tags.value.trim())
    formData.append('file', file.value)
    formData.append('userId', user.value?.id || 'me')
    formData.append('author', user.value?.name || '浙大同学')
    
    // 如果没有输入具体 sections，由后端默认生成
    await uploadFile('/api/notes', formData)
    
    showSuccess.value = true
    setTimeout(() => {
      resetForm()
      emit('success')
    }, 1500)
  } catch (err) {
    submitError.value = err.message || '上传失败，请重试'
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  title.value = ''
  course.value = ''
  type.value = '课程笔记'
  difficulty.value = '基础夯实'
  isPaid.value = false
  desc.value = ''
  tags.value = ''
  file.value = null
  fileName.value = ''
  fileSize.value = ''
  showSuccess.value = false
  submitError.value = ''
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <!-- 遮罩层 -->
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

    <!-- 弹窗卡片 -->
    <div class="relative w-full max-w-2xl bg-white border border-gray-100 rounded-[32px] shadow-2xl overflow-hidden transform transition-all z-10 animate-google-in">
      <!-- 头部 -->
      <div class="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/20">
        <div>
          <h3 class="text-xl font-black text-gray-900">分享复习资料</h3>
          <p class="text-xs text-gray-400 mt-1">上传你的课程笔记、试卷或大纲，促进知识流转</p>
        </div>
        <button @click="emit('close')" class="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 成功状态覆盖层 -->
      <div v-if="showSuccess" class="p-12 flex flex-col items-center justify-center text-center h-[520px]">
        <CheckCircle class="w-16 h-16 text-green-500 animate-bounce mb-4" />
        <h4 class="text-2xl font-black text-gray-900">分享成功！</h4>
        <p class="text-sm text-gray-500 mt-2">感谢你为求是知识社区做出的贡献</p>
      </div>

      <!-- 表单主体 -->
      <form v-else @submit.prevent="handleSubmit" class="p-8 max-h-[75vh] overflow-y-auto flex flex-col gap-6">
        <!-- 错误提示 -->
        <div v-if="submitError" class="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle class="w-5 h-5 shrink-0" />
          <span>{{ submitError }}</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 标题 -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">资料标题 <span class="text-red-500">*</span></label>
            <input v-model="title" type="text" placeholder="例如：微积分极限与连续核心知识梳理" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors" required />
          </div>

          <!-- 关联课程 -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">关联课程 <span class="text-red-500">*</span></label>
            <input v-model="course" type="text" placeholder="例如：微积分、线性代数" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors" required />
          </div>

          <!-- 资料分类 -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">资料分类</label>
            <select v-model="type" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors bg-white">
              <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>

          <!-- 难度级别 -->
          <div class="flex flex-col gap-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">难度级别</label>
            <select v-model="difficulty" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors bg-white">
              <option v-for="d in difficulties" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>

          <!-- 积分机制 -->
          <div class="flex flex-col justify-center">
            <label class="flex items-center gap-3 cursor-pointer mt-4 select-none">
              <input v-model="isPaid" type="checkbox" class="w-4 h-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500 focus:ring-offset-0" />
              <span class="text-sm font-black text-gray-600">需要消耗积分下载（积分兑换）</span>
            </label>
          </div>

          <!-- 标签 -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">标签（空格或逗号分隔）</label>
            <input v-model="tags" type="text" placeholder="例如：期末复习 真题 极限" class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors" />
          </div>

          <!-- 资料简介 -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">资料简介</label>
            <textarea v-model="desc" rows="3" placeholder="请简要描述本资料包含的核心内容或适用对象..." class="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-sm font-medium transition-colors resize-none"></textarea>
          </div>

          <!-- 文件上传 -->
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-xs font-black text-gray-400 uppercase tracking-wider">文件附件 <span class="text-red-500">*</span></label>
            
            <div 
              @dragover="onDragOver" 
              @dragleave="onDragLeave" 
              @drop="onDrop"
              :class="[
                'border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer',
                isDragging ? 'border-blue-600 bg-blue-50/30' : 'border-gray-200 hover:border-blue-500 hover:bg-slate-50/30'
              ]"
              @click="$refs.fileInput.click()"
              v-if="!file"
            >
              <input type="file" ref="fileInput" class="hidden" @change="onFileChange" accept=".txt,.pdf,.doc,.docx,.png,.jpg,.jpeg" />
              <div class="p-3 bg-blue-50 text-blue-600 rounded-full">
                <Upload class="w-6 h-6" />
              </div>
              <div class="text-center">
                <p class="text-sm font-black text-gray-700">点击上传或将文件拖拽到此处</p>
                <p class="text-xs text-gray-400 mt-1">支持 .txt, .pdf, .docx, .png, .jpg 格式</p>
              </div>
            </div>

            <!-- 已上传文件预览 -->
            <div v-else class="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between gap-4 animate-google-in">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                  <File class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-black text-gray-700 truncate max-w-[320px]">{{ fileName }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ fileSize }}</p>
                </div>
              </div>
              <button type="button" @click="removeFile" class="text-xs font-black text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                移除
              </button>
            </div>
          </div>
        </div>

        <!-- 提交按钮 -->
        <div class="flex items-center justify-end gap-3 mt-4 border-t border-gray-100 pt-6">
          <button type="button" @click="emit('close')" class="px-6 py-3 border border-gray-200 rounded-2xl text-sm font-black text-gray-500 hover:bg-slate-50 transition-colors">
            取消
          </button>
          <button type="submit" :disabled="isSubmitting" class="px-8 py-3 bg-blue-600 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2">
            <span v-if="isSubmitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span>{{ isSubmitting ? '上传中...' : '开始分享' }}</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
