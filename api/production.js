// api/production.js
import { get, post, postFormData } from '@/utils/request'
import { uploadFilesWithForm } from '@/utils/upload'; // 你已有的上传工具

export const submitSingleBatch = (data) => {
	return post('/api/work/save', data)
};

export const getTobaccoAll = () => {
	return get('/api/tobacco-grade/all')
}

// 验证批次工单
export const submitMaterialCheck = (data) => {
	return post('/api/verification/save', data)
};

// 验证批次工单
export const byBatchIdAndSegment = (batchId, segment) => {
	return get('/api/verification/byBatchIdAndSegment', {batchId:batchId, segment:segment})
};

// 烟沫统计相关API

// 插入烟沫统计数据
export const insertTobaccoDustStats = (data) => {
	return post('/api/tobacco/dust/stats/insert', data)
};

// 根据批次号查询烟沫统计数据
export const queryTobaccoDustStatsByBatchNo = (params) => {
	// 支持对象参数或字符串批次号
	const queryParams = typeof params === 'object' ? params : { batchNo: params };
	return get('/api/tobacco/dust/stats/queryByBatchNo', queryParams)
};
