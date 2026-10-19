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

const FALLBACK_DATA_MAP = {
  '/api/books': async () => {
    const list = await fetch('/data/books.json').then((r) => r.json()).catch(() => [])
    return { success: true, books: list }
  },
  '/api/ui': async () => {
    const data = await fetch('/data/ui.json').then((r) => r.json()).catch(() => ({}))
    return data
  },
  '/api/wishes': async () => {
    const list = await fetch('/data/wishes.json').then((r) => r.json()).catch(() => [])
    return { success: true, wishes: list }
  },
  '/api/notes': async () => {
    const list = await fetch('/data/notes.json').then((r) => r.json()).catch(() => [])
    return { success: true, notes: list }
  },
  '/api/favorites': async () => {
    return { success: true, bookIds: [] }
  },
  '/api/notifications': async () => {
    const list = await fetch('/data/notifications.json').then((r) => r.json()).catch(() => [])
    return { success: true, notifications: list }
  },
}

const requestJson = async (path, options = {}) => {
  const isGet = !options.method || options.method === 'GET'
  const cleanPath = path.split('?')[0]

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
    if (isGet && FALLBACK_DATA_MAP[cleanPath]) {
      return await FALLBACK_DATA_MAP[cleanPath]()
    }
    throw new Error('服务暂时不可用，请确认后端已启动')
  }

  if (response.status === 404 && isGet && FALLBACK_DATA_MAP[cleanPath]) {
    return await FALLBACK_DATA_MAP[cleanPath]()
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

export const streamJson = async (path, payload, handlers = {}) => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: {
      Accept: 'text/event-stream',
      ...authHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    throw new Error('服务暂时不可用，请确认后端已启动')
  })
  if (!response.ok || !response.body) throw new Error('AI 流式服务暂时不可用')
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() || ''
    for (const chunk of chunks) handleSseChunk(chunk, handlers)
  }
  if (buffer) handleSseChunk(buffer, handlers)
}

const handleSseChunk = (chunk, handlers) => {
  const event = (chunk.match(/^event:\s*(.+)$/m) || [])[1]
  const dataText = chunk.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
  if (!event || !dataText) return
  const data = JSON.parse(dataText)
  if (event === 'error') throw new Error(data.message || 'AI 服务暂时不可用')
  handlers[event]?.(data)
}
