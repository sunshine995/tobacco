// api/fault.js
import { get, post, put, del, postFormData } from '@/utils/request'
import { uploadFilesWithForm } from '@/utils/upload'

// 👇 所有接口路径集中管理（便于维护）
const API = {
  REPORT: '/api/fault/report',           // 提交报警（含图片）
  DETAIL: '/api/fault/detail',           // 获取详情
  LIST: '/api/fault/faultListByType',               // 分页查询
  ARRIVE: '/api/fault/arrive',           // 维修工到场
  REPAIR: '/api/fault/repair',           // 修复完成
  CANCEL: '/api/fault/cancel',           // 用户取消
  DELETE: '/api/fault/delete'            // 管理员删除
}

/**
 * 📌 提交故障报警（智能处理图片：有图上传，无图普通表单）
 * @param {Object} data - 表单数据（不含 images）
 * @param {Array} images - u-upload 的图片对象数组 [{ url: 'tempFilePath', ... }]
 * @returns {Promise<number>} faultId
 */
export const reportFault = (data) => {
	return post(API.REPORT, data)
};

/**
 * 📌 获取故障详情
 * @param {number} id - 故障ID
 * @returns {Promise<FaultDetail>} 故障详情对象
 */
export const getFaultDetail = (id) => {
  return get(API.DETAIL, { id })
    .then(data => {
      console.log('[API] 获取详情:', data)
      return data
    })
}

/**
 * 📌 分页查询故障列表
 * @param {Object} params - 分页参数
 * @param {number} params.pageNum - 页码（从1开始）
 * @param {number} params.pageSize - 每页数量
 * @param {string} [params.status] - 状态过滤（reported, arrived, repaired, cancelled）
 * @param {string} [params.type] - 类型过滤（electrical, mechanical）
 * @returns {Promise<PageResult<FaultItem>>}
 */
export const getFaultList = (params = { pageNum: 1, pageSize: 10 }) => {
  return get(API.LIST, params)
    .then(result => {
      console.log('[API] 获取列表:', result)
      return result
    })
}



/**
 * 📌 用户取消报警
 * @param {number} id - 故障ID
 * @returns {Promise<void>}
 */
export const cancelFault = (id) => {
  return post(API.CANCEL, { id })
    .then(() => {
      console.log('[API] 已取消报警:', id)
    })
}

/**
 * 📌 管理员删除故障（软删除）
 * @param {number} id - 故障ID
 * @returns {Promise<void>}
 */
export const deleteFault = (id) => {
  return del(API.DELETE, { id })
    .then(() => {
      console.log('[API] 已删除故障:', id)
    })
}

/**
 * 📌 根据维修工类别分页查询故障列表
 * @param {string} repairType - 维修类别，如 'electrical', 'mechanical'
 * @param {Object} params - 分页参数（可选）
 * @param {string} [params.status] - 可选的状态过滤
 * @returns {Promise<PageResult<FaultItem>>}
 *
 * @example
 * getFaultListByType('electrical', { pageNum: 1, pageSize: 10 })
 */
export const getFaultListByTypeApi = (params = {}) => {
  return get(API.LIST, params)
    .then(result => {
      return result
    })
}

/**
 * 📌 更新故障状态（支持上传图片）
 * 可用于：开始维修（reported → in_progress）或 完成维修（in_progress → repaired）
 * 
 * @param {number} id - 故障ID
 * @param {Object} data - 状态和图片数据
 * @param {string} data.status - 目标状态: 'in_progress' | 'repaired'
 * @param {Array<string>} [data.images] - 图片URL数组（可选）
 * @returns {Promise<void>}

 */
export const updateFaultStatusApi = (data) => {
	return post(API.REPAIR, data)
};

export const updateAdminStatusApi = (data) => {
  return post('/api/fault/arrive', data);
}
