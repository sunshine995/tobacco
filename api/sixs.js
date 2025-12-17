import { get, post} from '@/utils/request'

//✅ 提交任务
export const submitTasks = (data) => {
	  console.log(data)
    return post('/api/sixs/templates/submitTasks', data);
};


// 根据用户id获取当天任务
export const getSixDay = (id) => {
  return get(`/api/sixs/templates/getSixDay`, {userId: id})  // ✅ get(url)
}

// 获取所有任务
export const getAllSixDay = () => {
  return get('/api/sixs/templates/getAllSixDay')  // ✅ get(url)
}

// 根据任务id获取任务详情
export const getTaskById = (id) => {
  return get(`/api/sixs/templates/getSixTaskById`, {taskId: id})  
}


//✅ 提交抽检
export const submitSpotCheck = (data) => {
    return post('/api/sixs/templates/submitSpotCheck', data);
};