// 测试调试页面
Page({
  data: {
    colleges: [
      '建筑工程学院',
      '智能制造与电梯学院',
      '新能源工程与汽车学院',
      '信息工程与物联网学院',
      '经济管理与电商学院',
      '旅游管理学院',
      '艺术设计与时尚创意学院',
      '社会发展与公共教育学院'
    ]
  },

  testJump() {
    console.log("=== 开始测试 ===");
    
    // 测试1：检查页面是否存在
    const pages = getCurrentPages();
    console.log("当前页面:", pages[0] && pages[0].route);
    
    // 测试2：检查目标页面
    wx.navigateTo({
      url: '/pages/courses/index?college=建筑工程学院',
      success: () => {
        console.log("✅ 跳转成功");
      },
      fail: (err) => {
        console.error("❌ 跳转失败:", err);
        wx.showModal({
          title: '跳转失败',
          content: JSON.stringify(err),
          showCancel: false
        });
      }
    });
  }
});