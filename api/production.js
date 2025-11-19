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
