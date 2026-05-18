import { ref } from 'vue'

export function useDataLoader(url, transform = (json) => json, fallback = []) {
  const data = ref(fallback)
  const loading = ref(true)
  const error = ref(null)

  fetch(url)
    .then((res) => res.json())
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
