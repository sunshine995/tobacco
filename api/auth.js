import { post, get } from '@/utils/request'

export const loginApi = (data) => {
  return post('/api/user/login', data)
}

// registerApi 调用
export const registerApi = (data) => {
  return post('/api/user/register', data);
}

export const listUsers = () => {
  return get('/api/user/all')
}