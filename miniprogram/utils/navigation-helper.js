// 导航帮助工具 - 解决跳转失败
const navigationHelper = {
  // 检查页面是否存在
  checkPageExists(pagePath) {
    try {
      const pages = getCurrentPages();
      const exists = pages.some(page => page.route === pagePath.replace('pages/', ''));
      return exists;
    } catch (error) {
      return false;
    }
  },

  // 安全的导航函数
  safeNavigate(url, params = {}) {
    console.log('=== 导航开始 ===');
    console.log('目标URL:', url);
    console.log('参数:', params);

    // 构建完整URL
    let fullUrl = url;
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      fullUrl += `?${queryString}`;
    }

    console.log('完整URL:', fullUrl);

    return new Promise((resolve, reject) => {
      wx.navigateTo({
        url: fullUrl,
        success: (res) => {
          console.log('跳转成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('跳转失败:', err);
          
          // 检查是否为页面不存在
          if (err.errMsg.includes('not found') || err.errMsg.includes('fail')) {
            console.error('页面可能不存在，尝试使用备用方案');
            
            // 使用switchTab作为备用方案
            if (url.includes('courses')) {
              wx.switchTab({
                url: '/pages/courses/index',
                success: resolve,
                fail: reject
              });
            } else {
              reject(err);
            }
          } else {
            reject(err);
          }
        }
      });
    });
  },

  // 学院卡片专用跳转
  navigateToCollege(collegeName) {
    console.log('学院跳转:', collegeName);
    return this.safeNavigate('/pages/courses/index', { college: collegeName });
  },

  // 调试模式
  debugMode() {
    const testUrls = [
      '/pages/courses/index',
      '/pages/mine/mine',
      '/pages/news/index',
      '/pages/profile/index',
      '/pages/about/index'
    ];

    testUrls.forEach(url => {
      console.log(`测试URL: ${url}`);
      wx.navigateTo({
        url,
        success: () => console.log(`✅ ${url} 成功`),
        fail: (err) => console.error(`❌ ${url} 失败:`, err)
      });
    });
  }
};

module.exports = navigationHelper;