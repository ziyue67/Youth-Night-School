// WebView页面 - 用于显示外部链接内容
Page({
  data: {
    url: '',
    title: '',
    loadError: false,
    errorMessage: ''
  },

  onLoad(options) {
    console.log('WebView页面参数:', options);
    
    const { url, title } = options;
    
    if (url) {
      const decodedUrl = decodeURIComponent(url);
      const decodedTitle = decodeURIComponent(title || '外部链接');
      
      this.setData({
        url: decodedUrl,
        title: decodedTitle
      });
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: decodedTitle
      });
      
      console.log('WebView加载URL:', decodedUrl);
      console.log('WebView标题:', decodedTitle);
    } else {
      this.setData({
        loadError: true,
        errorMessage: '链接无效'
      });
      wx.showToast({
        title: '链接无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 处理网页加载成功
  onWebLoadSuccess() {
    console.log('网页加载成功');
    this.setData({
      loadError: false
    });
  },

  // 处理网页加载失败
  onWebLoadError(e) {
    console.error('网页加载失败:', e);
    this.setData({
      loadError: true,
      errorMessage: '网页加载失败'
    });
  },

  // 复制链接到微信
  copyToWeChat() {
    wx.setClipboardData({
      data: this.data.url,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.title,
      path: `/pages/webview/webview?url=${encodeURIComponent(this.data.url)}&title=${encodeURIComponent(this.data.title)}`
    };
  }
});