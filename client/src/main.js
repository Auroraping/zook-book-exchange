import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { useAuth } from './composables/useAuth.js'
import './tailwind.css'

const bootstrap = async () => {
  const { restoreSession } = useAuth()
  await restoreSession()
  const app = createApp(App)
  app.use(router)
  app.mount('#app')
}

bootstrap()
