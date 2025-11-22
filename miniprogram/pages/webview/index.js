// WebView页面 - 用于显示外部链接内容
Page({
  data: {
    url: '',
    title: ''
  },

  onLoad(options) {
    const { url, title } = options;
    
    if (url) {
      this.setData({
        url: decodeURIComponent(url),
        title: decodeURIComponent(title || '外部链接')
      });
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: decodeURIComponent(title || '外部链接')
      });
    } else {
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
  },

  // 处理网页加载失败
  onWebLoadError(e) {
    console.error('网页加载失败:', e);
    wx.showToast({
      title: '网页加载失败',
      icon: 'none'
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.title,
      path: `/pages/webview/webview?url=${encodeURIComponent(this.data.url)}&title=${encodeURIComponent(this.data.title)}`
    };
  }
});