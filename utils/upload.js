// @/utils/upload.js
// 专用于处理带文件上传的表单（如故障报警）

/**
 * 一次请求上传多个文件 + 表单数据（适用于 H5、App）
 * @param {string} url - 上传接口地址
 * @param {Object} formData - 表单数据（如故障描述）
 * @param {Array} files - 文件列表，格式：[{ url: '临时路径' }]
 * @param {string} fieldName - 后端 @RequestParam 的 name，默认 'images'
 * @returns {Promise<any>}
 */
export function uploadFilesWithForm(url, formData, files, fieldName = 'images') {
	console.log(files)
  return new Promise((resolve, reject) => {
    // 1. 无文件时，走普通请求
    if (!files || files.length === 0) {
      console.log('[upload] 无图片，使用 request 提交:', formData);
	  console.log("原始的" + formData )
	  const fullUrl = ensureFullUrl(url); // ⬅️ 加上这一句！
	  
      uni.request({
        url: fullUrl,
        method: 'POST',
        data: formData,
        success: (res) => {
          console.log('[upload] request 成功:', res.data);
          resolve(res.data);
        },
        fail: (err) => {
          console.error('[upload] request 失败:', err);
          reject(err);
        }
      });
      return;
    }

    // 2. 确保 url 完整（H5 关键）
    const fullUrl = ensureFullUrl(url);

    console.log('[upload] 开始上传文件:', {
      fullUrl,
      formData,
      fileCount: files.length,
      sampleFile: files[0]?.url
    });

    // ✅ 构造 files 数组（uni.uploadFile 要求的格式）
    const uploadFiles = files.map(file => ({
      uri: file.url, // 必须是 'uri'
      name: 'images',     // 可选：文件名
      // fileType: 1          // 可选：1=图片，2=视频
    }));

    // ✅ 一次请求上传所有文件
    const task = uni.uploadFile({
      url: fullUrl,
      // ✅ 使用 files 数组一次性传所有文件
      files: uploadFiles,
      // ✅ name 必须与后端 @RequestParam("xxx") 一致
      name: fieldName, // 如后端是 @RequestParam("images")，这里就是 'images'
      // ✅ 所有表单数据一次传完
      formData: formData,
      header: {
        'Authorization': 'Bearer ' + uni.getStorageSync('token')
        // 其他 header...
      },
      success: (res) => {
        console.log('[upload] 上传成功:', res);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          let data;
          try {
            data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
          } catch (e) {
            return reject(new Error('响应数据解析失败'));
          }

          // ✅ 假设后端返回 { code: 200, data: faultId, message: 'ok' }
          if (data.code === 200) {
            console.log('[upload] 提交成功', data);
            resolve(data.data); // 返回 faultId
          } else {
            reject(new Error(data.message || '上传失败'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      },
      fail: (err) => {
        console.error('[upload] 上传失败:', err);
        reject(err);
      }
    });

    // ✅ 可选：监听上传进度
    // task.onProgressUpdate((progressRes) => {
    //   console.log('上传进度', progressRes.progress);
    // });
  });
}

// 👇 工具函数：确保 URL 是完整地址（H5 平台必须）
function ensureFullUrl(relativeOrFullUrl) {

  // 判断是否已经是完整 URL
  if (/^https?:\/\//.test(relativeOrFullUrl)) {
    return relativeOrFullUrl;
  }

  // #ifdef H5
  // H5 平台：开发环境指向本地后端
  const isDev = process.env.NODE_ENV === 'development';
  const baseUrl = isDev ? 'http://127.0.0.1:8081' : 'https://your-production-api.com';
   return baseUrl + (relativeOrFullUrl.startsWith('/') ? '' : '/') + relativeOrFullUrl;
  // #endif

  // #ifndef H5
  // 小程序/App 等平台使用相对路径（由 native 层处理）
  return relativeOrFullUrl;
  // #endif
}