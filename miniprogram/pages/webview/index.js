// WebView页面 - 用于显示外部链接内容
Page({
  data: {
    url: '',
    title: '',
    showWeChatTips: false,
    isWeChatArticle: false,
    useWebView: true
  },

  onLoad(options) {
    console.log('WebView页面参数:', options);
    
    const { url, title } = options;
    
    if (url) {
      const decodedUrl = decodeURIComponent(url);
      const decodedTitle = decodeURIComponent(title || '外部链接');
      
      // 检查是否为微信公众号文章
      const isWeChatArticle = decodedUrl.includes('mp.weixin.qq.com');
      
      this.setData({
        url: decodedUrl,
        title: decodedTitle,
        isWeChatArticle: isWeChatArticle
      });
      
      // 设置页面标题
      wx.setNavigationBarTitle({
        title: decodedTitle
      });
      
      console.log('WebView加载URL:', decodedUrl);
      console.log('WebView标题:', decodedTitle);
      console.log('是否为微信公众号文章:', isWeChatArticle);
      
      // 如果是微信公众号文章，尝试使用微信内置文章预览
      if (isWeChatArticle) {
        this.tryOpenWeChatArticle(decodedUrl, decodedTitle);
      }
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

  // 尝试打开微信公众号文章
  tryOpenWeChatArticle(url, title) {
    // 首先尝试使用微信内置文章预览
    if (wx.previewMessage) {
      wx.previewMessage({
        articles: [{
          title: title,
          path: url
        }],
        success: (res) => {
          console.log('文章预览成功', res);
          // 预览成功后返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 500);
        },
        fail: (err) => {
          console.error('文章预览失败', err);
          // 如果预览失败，使用web-view显示
          this.setData({
            useWebView: true,
            showWeChatTips: false
          });
        }
      });
    } else {
      // 如果不支持wx.previewMessage，使用web-view显示
      this.setData({
        useWebView: true,
        showWeChatTips: false
      });
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

  // WebView加载成功
  onWebViewLoad(e) {
    console.log('WebView加载成功', e);
  },

  // WebView加载失败
  onWebViewError(e) {
    console.error('WebView加载失败', e);
    // 如果WebView加载失败，显示备用界面
    this.setData({
      useWebView: false,
      showWeChatTips: true
    });
  },

  // 重新打开文章
  retryOpenArticle() {
    if (this.data.isWeChatArticle) {
      this.setData({
        showWeChatTips: false,
        useWebView: true
      });
      this.tryOpenWeChatArticle(this.data.url, this.data.title);
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: this.data.title,
      path: `/pages/webview/index?url=${encodeURIComponent(this.data.url)}&title=${encodeURIComponent(this.data.title)}`
    };
  }
});