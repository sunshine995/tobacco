import { get, post, put,del } from '@/utils/request'

export const saveWork = (data) => {
  return post('/api/work-group/create', data)
}

// 更新动态分组信息
export const updateWork = (data) => {
  return put('/api/work-group/updateWork', data);
}

// 通过创建者Id获取动态组
export const getWorkGroupByUserId = (creatorId) => {
  return get('/api/work-group/byUserId', {creatorId: creatorId});
}

// 为动态组添加成员
export const GroupAddMember = (data) => {
  return post('/api/work-group/addMember', data)
}


export const deleteGroupById = (id) => {
	console.log(id)
  return del(`/api/work-group/delete/${id}`)
}

export const removeMemberById = (groupId, userId) => {
  return del(`/api/work-group/${groupId}/members/${userId}`)
}