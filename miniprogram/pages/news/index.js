// 动态页面
Page({
  data: {
    newsList: [
      { 
        id: 1, 
        title: "青春夜校开学典礼成功举办", 
        date: "2024-09-01",
        type: "normal"
      },
      { 
        id: 2, 
        title: "新生破冰活动圆满结束", 
        date: "2024-09-05",
        type: "normal"
      },
      { 
        id: 3, 
        title: "月度优秀学员表彰", 
        date: "2024-09-15",
        type: "normal"
      },
      { 
        id: 4, 
        title: "湖职榜样|盛浩洁:以微薄之力,让科技有温度,让爱心有回响", 
        date: "官方资讯",
        type: "wechat",
        url: "https://mp.weixin.qq.com/s/hzgONdwEJaMm18JIYa6bMA",
        image: "/images/icons/customer-service.svg"
      },
      { 
        id: 5, 
        title: "湖州职业技术学院官网", 
        date: "官方资讯",
        type: "wechat",
        url: "https://www.huvtc.edu.cn/",
        image: "/images/icons/customer-service.svg"
      }
    ]
  },

  // 点击新闻项
  onNewsTap(e) {
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
  }
});