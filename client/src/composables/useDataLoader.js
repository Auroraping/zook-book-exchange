import { ref } from 'vue'

export function useDataLoader(url) {
  const data = ref([])
  const loading = ref(true)
  const error = ref(null)

  fetch(url)
    .then((res) => res.json())
    .then((json) => {
      data.value = json
    })
    .catch((err) => {
      error.value = err.message
    })
    .finally(() => {
      loading.value = false
    })

  return { data, loading, error }
}
