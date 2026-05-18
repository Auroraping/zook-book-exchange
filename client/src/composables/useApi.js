const API_BASE = import.meta.env.VITE_API_BASE || ''

export const apiUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

export const postJson = async (path, payload) => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.message || '服务暂时不可用')
  }
  return data
}
