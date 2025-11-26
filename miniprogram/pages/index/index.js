const { COLLEGES, navigateToPage, storage, callCloudFunction, formatDate } = require('../../utils/common');

// 首页逻辑 - 优化后减少冗余
Page({
  data: {
    currentTab: 0,
    recentNews: [], // 存储前3条动态文章
    loading: true
  },

  onLoad() {
    console.log("=== 首页加载 ===");
    this.loadRecentNews();
  },

  // 加载近期动态文章
  async loadRecentNews() {
    try {
      const res = await callCloudFunction('getLocalWechatArticles', {}, false);
      
      if (res.result && res.result.success) {
        const newsList = res.result.data.map(article => ({
          id: article._id || article.id,
          title: article.title,
          date: formatDate(article.publish_time),
          type: "wechat",
          url: article.link,
          description: article.title,
          image: "/images/icons/customer-service.svg"
        }));
        
        // 只取前3条
        const recentNews = newsList.slice(0, 3);
        
        this.setData({
          recentNews,
          loading: false
        });
      } else {
        console.error('获取动态文章失败:', res.result?.error || '未知错误');
        this.setData({
          recentNews: [],
          loading: false
        });
      }
    } catch (err) {
      console.error('云函数调用失败:', err);
      this.setData({
        recentNews: [],
        loading: false
      });
    }
  },

  // 学院卡片点击事件 - 使用通用函数优化
  onCollegeTap(e) {
    const college = e.currentTarget.dataset.college;
    console.log("=== 点击学院卡片 ===", college);
    
    // 使用常量验证学院名称
    if (!COLLEGES.includes(college)) {
      console.error("❌ 无效的学院名称:", college);
      wx.showToast({
        title: '学院信息错误',
        icon: 'none'
      });
      return;
    }
    
    // 使用通用跳转函数
    const url = `/pages/courses/index?college=${encodeURIComponent(college)}`;
    navigateToPage(url, 'switchTab:/pages/courses/index');
    
    // 存储选择的学院信息
    storage.set('selectedCollege', college);
    storage.set('collegeTimestamp', Date.now());
  },

  // 更多按钮点击事件 - 跳转到动态页面
  onMoreTap() {
    navigateToPage("/pages/news/index", 'switchTab:/pages/news/index');
  },

  // 动态文章点击事件
  onNewsTap(e) {
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

  // 关于我们按钮点击事件 - 使用通用函数
  onAboutTap() {
    navigateToPage("/pages/about/index");
  }
});