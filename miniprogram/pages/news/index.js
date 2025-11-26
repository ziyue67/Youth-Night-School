// 动态页面
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

  // 加载微信公众号文章
  loadWechatArticles: function() {
    wx.showLoading({
      title: '加载中...'
    });

    wx.cloud.callFunction({
      name: 'getLocalWechatArticles'
    }).then(res => {
      wx.hideLoading();
      
      if (res.result && res.result.success) {
        const wechatArticles = res.result.data.map(article => ({
          id: article._id || article.id,
          title: article.title,
          date: this.formatDate(article.publish_time),
          type: "wechat",
          url: article.link,
          description: article.title, // 使用标题作为描述
          image: "/images/icons/customer-service.svg",
          author: '',
          readCount: 0,
          likeCount: 0
        }));
        
        this.setData({
          wechatArticles: wechatArticles,
          newsList: [...this.data.newsList, ...wechatArticles],
          loading: false
        });
      } else {
        console.error('获取公众号文章失败:', res.result?.error || '未知错误');
        this.setData({
          loading: false
        });
        // 如果获取失败，使用默认的文章
        this.setDefaultWechatArticles();
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('云函数调用失败:', err);
      this.setData({
        loading: false
      });
      // 如果获取失败，使用默认的文章
      this.setDefaultWechatArticles();
    });
  },

  // 格式化日期
  formatDate: function(dateString) {
    if (!dateString) return '官方资讯';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '官方资讯';
    
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
  },

  // 设置默认的微信公众号文章
  setDefaultWechatArticles: function() {
    // 不设置默认文章，直接显示空状态
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

  // 点击新闻项
  onNewsTap: function(e) {
    const { item } = e.currentTarget.dataset;
    
    if (item.type === 'wechat') {
      // 跳转到微信公众号文章
      wx.navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(item.url)}&title=${encodeURIComponent(item.title)}`
      });
    } else {
      // 普通新闻处理
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