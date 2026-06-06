export const getStored = (key) => sessionStorage.getItem(key) || localStorage.getItem(key)

export const setStored = (key, value) => {
  if (value === undefined || value === null || value === '') return
  sessionStorage.setItem(key, value)
  if (localStorage.getItem('auth_token') === sessionStorage.getItem('auth_token')) {
    localStorage.setItem(key, value)
  }
}

export const removeStored = (key) => {
  sessionStorage.removeItem(key)
  if (localStorage.getItem('auth_token') === sessionStorage.getItem('auth_token')) {
    localStorage.removeItem(key)
  }
}

export const removeStoredMany = (keys) => {
  keys.forEach((key) => removeStored(key))
}
