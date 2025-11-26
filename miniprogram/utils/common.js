// 通用工具函数 - 减少代码冗余

// 学院列表常量
const COLLEGES = [
  '建筑工程学院',
  '智能制造与电梯学院', 
  '新能源工程与汽车学院',
  '信息工程与物联网学院',
  '经济管理与电商学院',
  '旅游管理学院',
  '艺术设计与时尚创意学院',
  '社会发展与公共教育学院'
];

// 统一的页面跳转函数
function navigateToPage(url, fallbackUrl = null) {
  wx.navigateTo({
    url: url,
    success: () => {
      console.log(`✅ 页面跳转成功: ${url}`);
    },
    fail: (err) => {
      console.warn(`navigateTo失败: ${url}`, err);
      if (fallbackUrl) {
        console.log(`尝试使用fallback: ${fallbackUrl}`);
        if (fallbackUrl.includes('switchTab')) {
          wx.switchTab({
            url: fallbackUrl.replace('switchTab:', '')
          });
        } else {
          wx.navigateTo({
            url: fallbackUrl
          });
        }
      }
    }
  });
}

// 统一的云函数调用函数
async function callCloudFunction(functionName, data, showLoading = true, loadingTitle = '加载中...') {
  let loadingShown = false;
  
  try {
    if (showLoading) {
      wx.showLoading({ title: loadingTitle });
      loadingShown = true;
    }
    
    const result = await wx.cloud.callFunction({
      name: functionName,
      data: data
    });
    
    return result;
  } catch (error) {
    console.error(`云函数调用失败: ${functionName}`, error);
    throw error;
  } finally {
    // 确保在所有情况下都隐藏加载提示
    if (loadingShown) {
      wx.hideLoading();
    }
  }
}

// 统一的错误处理函数
function handleError(error, defaultMessage = '操作失败') {
  console.error('错误:', error);
  const message = error.message || error.errMsg || defaultMessage;
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 3000
  });
}

// 统一的成功提示函数
function showSuccess(message = '操作成功') {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  });
}

// 格式化日期函数
function formatDate(dateString, formatType = 'relative') {
  if (!dateString) return '官方资讯';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '官方资讯';
  
  if (formatType === 'relative') {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
  } else if (formatType === 'full') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  
  return dateString;
}

// 用户登录状态检查
function checkUserLoginStatus() {
  const wxUserInfo = wx.getStorageSync('userInfo');
  const wxToken = wx.getStorageSync('token');
  const openid = wx.getStorageSync('openid');

  let userInfo = wxUserInfo || null;
  let isLogin = !!(userInfo || openid || wxToken);

  if (!userInfo && (openid || wxToken)) {
    userInfo = {
      openid: openid || wxToken,
      nickName: '微信用户',
      avatarUrl: '',
      points: (wxUserInfo && wxUserInfo.points) || 0,
    };
    try {
      wx.setStorageSync('userInfo', userInfo);
    } catch (e) {}
  }

  return { isLogin, userInfo, openid, token: wxToken };
}

// 检查今日签到状态
function checkTodaySignStatus() {
  const today = new Date().toISOString().slice(0, 10);
  const lastSignDate = wx.getStorageSync('lastSignDate');
  return lastSignDate === today;
}

// 统一的存储操作
const storage = {
  get: (key, defaultValue = null) => {
    try {
      return wx.getStorageSync(key) || defaultValue;
    } catch (e) {
      console.error(`读取存储失败: ${key}`, e);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      wx.setStorageSync(key, value);
      return true;
    } catch (e) {
      console.error(`写入存储失败: ${key}`, e);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      console.error(`删除存储失败: ${key}`, e);
      return false;
    }
  }
};

// 统一的网络请求封装
async function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    showLoading = true,
    loadingTitle = '加载中...'
  } = options;

  let loadingShown = false;

  if (showLoading) {
    wx.showLoading({ title: loadingTitle });
    loadingShown = true;
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        'content-type': 'application/json',
        ...header
      },
      success: (res) => {
        resolve(res);
      },
      fail: (error) => {
        reject(error);
      },
      complete: () => {
        // 确保在所有情况下都隐藏加载提示
        if (loadingShown) {
          wx.hideLoading();
        }
      }
    });
  });
}

module.exports = {
  COLLEGES,
  navigateToPage,
  callCloudFunction,
  handleError,
  showSuccess,
  formatDate,
  checkUserLoginStatus,
  checkTodaySignStatus,
  storage,
  request
};