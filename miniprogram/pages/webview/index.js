// WebView页面 - 用于显示外部链接内容
Page({
  data: {
    url: '',
    title: '',
    showWeChatTips: true
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
      wx.showToast({
        title: '链接无效',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
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

  // 在微信中打开
  openInWeChat() {
    this.copyToWeChat();
    wx.showModal({
      title: '提示',
      content: '链接已复制到剪贴板，请在微信中粘贴打开',
      showCancel: false
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