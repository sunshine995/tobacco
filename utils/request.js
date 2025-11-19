//const BASE_URL = 'http://127.0.0.1:8081';
const BASE_URL = 'http://192.168.47.1:8081';
const TIMEOUT = 10000;

/**
 * 封装 uni.request
 */
export const request = (options) => {
  return new Promise((resolve, reject) => {
    // 显示加载（可选）
    uni.showLoading({
      title: '请求中...',
      mask: true
    });

    // 创建请求任务
    const task = uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        uni.hideLoading();
        
        // ✅ 判断后端返回格式 { code: 200, msg: '', data: {} }
        if (res.statusCode === 200) {
          if (res.data.code === 200) {
            resolve(res.data.data); // 只返回业务数据
          } else {
            uni.showToast({
              title: res.data.msg || '请求失败',
              icon: 'none',
              duration: 2000
            });
            reject(new Error(res.data.msg));
          }
        } else {
          uni.showToast({
            title: `服务异常 [${res.statusCode}]`,
            icon: 'none',
            duration: 2000
          });
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        uni.hideLoading();
        uni.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });
  });
};

// ✅ 便捷方法
export const get = (url, data) => {
  const queryString = data ? '?' + Object.keys(data)
    .map(key => `${key}=${encodeURIComponent(data[key])}`)
    .join('&') : '';
  return request({ url: url + queryString, method: 'GET' });
};

export const post = (url, data) => {
  return request({ url, method: 'POST', data });
};

export const put = (url, data) => {
  return request({ url, method: 'PUT', data });
};

export const del = (url, data) => {
  return request({ url, method: 'DELETE', data });
};

/**
 * 专门用于 multipart/form-data 格式的请求
 */
export const requestMultipart = (url, formData) => {
  return new Promise((resolve, reject) => {
    uni.showLoading({
      title: '请求中...',
      mask: true
    });

    // 使用 uni.uploadFile 来发送 multipart/form-data 请求
    const task = uni.uploadFile({
      url: BASE_URL + url,
      formData: formData, // 这是关键：使用 formData 而不是 data
      success: (res) => {
        uni.hideLoading();
        try {
          const response = JSON.parse(res.data);
          if (res.statusCode === 200) {
            if (response.code === 200) {
              resolve(response.data);
            } else {
              uni.showToast({
                title: response.msg || '请求失败',
                icon: 'none',
                duration: 2000
              });
              reject(new Error(response.msg));
            }
          } else {
            uni.showToast({
              title: `服务异常 [${res.statusCode}]`,
              icon: 'none',
              duration: 2000
            });
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          console.error('解析响应失败:', e);
          reject(e);
        }
      },
      fail: (err) => {
        uni.hideLoading();
        uni.showToast({
          title: '网络错误，请检查服务是否启动',
          icon: 'none',
          duration: 2000
        });
        reject(err);
      }
    });

  });
};

// ✅ 专门用于表单数据的 POST 请求
export const postFormData = (url, data) => {
  const formData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) {
      formData[key] = value;
    }
  }
  return requestMultipart(url, formData);
};



