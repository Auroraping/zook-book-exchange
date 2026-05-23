import { ref } from 'vue'

const jsonCache = new Map()

const loadJson = async (url) => {
  if (!jsonCache.has(url)) {
    jsonCache.set(url, fetch(url).then((res) => {
      if (!res.ok) throw new Error(`无法加载 ${url}`)
      return res.json()
    }))
  }
  return jsonCache.get(url)
}

export function useDataLoader(url, transform = (json) => json, fallback = []) {
  const data = ref(fallback)
  const loading = ref(true)
  const error = ref(null)

  loadJson(url)
    .then((json) => {
      data.value = transform(json)
    })
    .catch((err) => {
      data.value = fallback
      error.value = err.message
    })
    .finally(() => {
      loading.value = false
    })

  return { data, loading, error }
}
