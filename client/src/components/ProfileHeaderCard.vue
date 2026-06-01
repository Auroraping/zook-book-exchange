<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Calendar, ShieldCheck, Star, Camera, Pencil } from 'lucide-vue-next'
import { postJson } from '../composables/useApi.js'
import { useAuth } from '../composables/useAuth.js'

const props = defineProps({
  profileUser: { type: Object, required: true },
  isMe: { type: Boolean, default: false }
})

defineEmits(['edit-avatar'])

const isEditingName = ref(false)
const tempName = ref('')
const savingName = ref(false)
const { updateUser } = useAuth()

const startEditName = () => {
  tempName.value = props.profileUser.name
  isEditingName.value = true
}

const saveName = async () => {
  const newName = tempName.value.trim()
  if (!newName) {
    isEditingName.value = false
    return
  }
  if (newName === props.profileUser.name) {
    isEditingName.value = false
    return
  }
  savingName.value = true
  try {
    const res = await postJson('/api/user/update', { 
      userId: props.profileUser.id || 'me', 
      name: newName,
      studentId: localStorage.getItem('zook_username')
    })
    if (res.success) {
      props.profileUser.name = newName
      updateUser({ name: newName })
    } else {
      alert(res.message || '更新网名失败，请重试')
    }
  } catch (err) {
    alert(err.message || '网络或服务异常，更新网名失败')
  } finally {
    savingName.value = false
    isEditingName.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
    <div class="h-40 bg-gradient-to-r from-blue-600 to-blue-400 relative"><div class="absolute inset-0 opacity-20"></div></div>
    <div class="px-12 pb-8 relative">
      <div class="flex justify-between items-end">
        <div class="flex items-end gap-8 mt-[-60px]">
          <div class="relative group cursor-pointer" @click="isMe ? $emit('edit-avatar') : null">
            <img :src="profileUser.avatar" class="w-40 h-40 rounded-3xl border-[6px] border-white shadow-xl bg-white object-cover" />
            <!-- 高端悬停修改遮罩 -->
            <div v-if="isMe" class="absolute inset-[6px] rounded-[18px] bg-black/45 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-1 text-white">
              <Camera class="w-6 h-6 animate-pulse" />
              <span class="text-[10px] font-black tracking-widest uppercase">修改头像</span>
            </div>
            <div v-if="profileUser.credit >= 4.8" class="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-xl shadow-lg border-2 border-white"><Star class="w-5 h-5 fill-current" /></div>
          </div>
          <div class="mb-2">
            <div class="flex items-center gap-3 mb-1">
              <div v-if="isEditingName" class="flex items-center gap-2">
                <input v-model="tempName" @keyup.enter="saveName" @blur="saveName" :disabled="savingName" type="text" class="text-3xl font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 outline-none focus:border-blue-500 w-48 transition-all shadow-inner" />
                <svg v-if="savingName" class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>
              <div v-else class="flex items-center gap-2 group">
                <h2 class="text-3xl font-black text-gray-800">{{ profileUser.name }}</h2>
                <button v-if="isMe" @click="startEditName" class="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-transparent hover:border-blue-100 bg-white hover:shadow">
                  <Pencil class="w-4 h-4" />
                </button>
              </div>
              <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100">{{ profileUser.level || 'Lv.1' }}</span>
            </div>
            
            <div v-if="isMe && profileUser.realName" class="mb-2.5">
              <span class="px-2.5 py-1 bg-green-50/50 text-green-700 text-xs font-bold rounded-xl border border-green-100 shadow-sm flex items-center gap-1.5 w-fit">
                <ShieldCheck class="w-3.5 h-3.5" /> 真实教务姓名：{{ profileUser.realName }} <span class="text-green-600/60 font-normal ml-0.5 text-[10px]">(已保护，仅您自己可见)</span>
              </span>
            </div>
            
            <p class="text-gray-500 font-medium text-sm mb-3">{{ profileUser.bio }}</p>
            <div v-if="profileUser.studentId" class="flex flex-wrap gap-2 mb-4">
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学院：{{ profileUser.college }}</span>
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">专业：{{ profileUser.major }}</span>
              <span class="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs font-bold rounded-lg border border-gray-100 shadow-sm">学号：{{ profileUser.studentId }}</span>
            </div>
            <div v-else class="mb-4">
              <RouterLink to="/schedule" class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-all shadow-sm">提示：前往「我的课表」同步教务，即可一键完成实名认证</RouterLink>
            </div>
            <div class="flex items-center gap-6">
              <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><Calendar class="w-4 h-4" /> 加入时间: {{ profileUser.joinDate }}</div>
              <div class="flex items-center gap-1.5 text-xs text-gray-400 font-bold"><ShieldCheck :class="['w-4 h-4', profileUser.studentId ? 'text-green-500' : 'text-gray-300']" /> {{ profileUser.studentId ? '已通过浙大统一身份认证' : '未完成统一身份认证' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
