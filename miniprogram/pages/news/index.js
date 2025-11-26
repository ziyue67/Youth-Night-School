const { callCloudFunction, formatDate, navigateToPage } = require('../../utils/common');

// 动态页面 - 优化后减少冗余
Page({
  data: {
    newsList: [],
    loading: true,
    wechatArticles: []
  },

  onLoad: function() {
    this.loadNewsData();
  },

  // 加载新闻数据
  loadNewsData: function() {
    this.loadWechatArticles();
  },

  // 加载微信公众号文章 - 使用通用云函数调用
  async loadWechatArticles() {
    try {
      const res = await callCloudFunction('getLocalWechatArticles', {}, true, '加载文章中...');
      
      if (res.result && res.result.success) {
        const wechatArticles = res.result.data.map(article => ({
          id: article._id || article.id,
          title: article.title,
          date: formatDate(article.publish_time),
          type: "wechat",
          url: article.link,
          description: article.title,
          image: "/images/icons/customer-service.svg",
          author: '',
          readCount: 0,
          likeCount: 0
        }));
        
        this.setData({
          wechatArticles,
          newsList: [...this.data.newsList, ...wechatArticles],
          loading: false
        });
      } else {
        console.error('获取公众号文章失败:', res.result?.error || '未知错误');
        this.setDefaultWechatArticles();
      }
    } catch (err) {
      console.error('云函数调用失败:', err);
      this.setDefaultWechatArticles();
    }
  },

  // 设置默认的微信公众号文章
  setDefaultWechatArticles: function() {
    this.setData({
      wechatArticles: [],
      newsList: [],
      loading: false
    });
  },

  // 刷新新闻数据
  onRefresh: function() {
    this.setData({
      loading: true,
      newsList: []
    });
    this.loadNewsData();
  },

  // 点击新闻项 - 使用通用跳转函数
  onNewsTap: function(e) {
    const { item } = e.currentTarget.dataset;
    
    if (item.type === 'wechat') {
      const url = `/pages/webview/index?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}`;
      navigateToPage(url);
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.onRefresh();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});