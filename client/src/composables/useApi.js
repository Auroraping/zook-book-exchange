const API_BASE = import.meta.env.VITE_API_BASE || ''

export const apiUrl = (path) => {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE}${normalized}`
}

const parseJsonResponse = async (response) => {
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.success === false) {
    let errMsg = data.message
    if (!errMsg) {
      if (response.status === 404) errMsg = '未找到该服务接口或资源 (404)，请刷新页面重试'
      else if (response.status === 403) errMsg = '您无权执行此操作 (403)'
      else errMsg = '服务暂时不可用，请稍后再试'
    }
    throw new Error(errMsg)
  }
  return data
}

const authHeader = (overrideToken) => {
  const token = overrideToken || sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const requestJson = async (path, options = {}) => {
  let response
  try {
    response = await fetch(apiUrl(path), {
      method: options.method || 'GET',
      headers: {
        Accept: 'application/json',
        ...authHeader(options.token),
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

export const postJson = (path, payload, token) => requestJson(path, { method: 'POST', body: payload, token })

export const patchJson = (path, payload) => requestJson(path, { method: 'PATCH', body: payload })

export const deleteJson = (path) => requestJson(path, { method: 'DELETE' })

export const uploadFile = async (path, formData) => {
  let response
  try {
    response = await fetch(apiUrl(path), {
      method: 'POST',
      headers: authHeader(),
      body: formData,
    })
  } catch {
    throw new Error('服务暂时不可用，请确认后端已启动')
  }
  return parseJsonResponse(response)
}
