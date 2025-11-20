import { post, get } from '@/utils/request'

//箱皮管理 
export const selectByBoxDate = () => {
    return get('/api/recordBox/get')
}


export const saveRecordBox = (data) => {
    return post('/api/recordBox/getRecent', data)
}

// 膨化烟丝管理
export const selectByInventory = () => {
    return get('/api/tobacco-inventory/getRecent')
}

export const saveRecordInventory = (data) => {
    return post('/api/tobacco-inventory/save', data)
}

// 残烟丝管理
export const saveDottleInventory = (data) => {
    return post('/api/dottle/save', data)
}

export const selectdottle = (brandId) => {
    return get(`/api/dottle/query`, {brandId: brandId})
}

export const queryDayDottle = () => {
    return get('/api/dottle/queryDayDottle')
}

// 更新残烟丝库存
export const updateDottleInventory = (data) => {
    return post('/api/dottle/update-inventory', data)
}
