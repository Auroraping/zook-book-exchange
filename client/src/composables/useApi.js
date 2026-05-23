const API_BASE = import.meta.env.VITE_API_BASE || ''

export const apiUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

const parseJsonResponse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    throw new Error(data.message || '服务暂时不可用')
  }
  return data
}

const requestJson = async (path, options = {}) => {
  let response
  try {
    response = await fetch(apiUrl(path), {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    })
  } catch {
    throw new Error('服务暂时不可用，请确认后端已启动')
  }

  return parseJsonResponse(response)
}

export const getJson = (path) => requestJson(path)

export const postJson = (path, payload) => requestJson(path, { method: 'POST', body: payload })

export const patchJson = (path, payload) => requestJson(path, { method: 'PATCH', body: payload })

export const deleteJson = (path) => requestJson(path, { method: 'DELETE' })
