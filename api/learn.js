import { post, get } from '@/utils/request'

// 这个获取学习
export const getLearnResource = (id) => {
    return get(`/api/learning/resource/getByType`, {id: id});
};

export const getLearnById = (id) => {
    return get(`/api/learning/resource/byId`, {id: id});
};