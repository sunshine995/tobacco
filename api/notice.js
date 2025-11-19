import { get, post, postFormData, put } from '@/utils/request'
import { uploadFilesWithForm } from '@/utils/upload'; // 你已有的上传工具

// ✅ 修改 publishNotice 函数
export const publishNotice = (data) => {
	console.log(data)
    return post('/api/notice/publish', data);
};

export const listDepartments = (id) => {
  return get(`/api/notice/departments`, {id: id})  // ✅ get(url)
}

export const listUsers = () => {
  return get('/api/notice/users')
}

export const listNotices = (data) => {
  return get('/api/notice/list', data)  // ✅ get(url, params)
}

export const getStats = (id) => {
  return get(`/api/notice/stats/${id}`)
}



export const getPromotionList = () => {
  return get('/api/notice/promotion/list')
}

export const toggleCarousel = (articleId, isInCarousel) => {
	
	const params = {
		articleId: articleId,
		isBanner: isInCarousel
	  };
  return put('/api/notice/updatePromotion',params)
}

export const saveArticled = (data) => {
	console.log(data)
    return post('/api/notice/save', data);
};


export const getArticleBanner = () => {
    return get('/api/notice/getArticleBanner');
};

export const getArticleDetail = (id) => {
    return get('/api/notice/getArticleDetail', {id: id});
};