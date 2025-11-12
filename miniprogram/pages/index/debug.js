// 调试工具 - 检查跳转问题
Page({
  data: {
    debugInfo: '点击测试按钮开始调试',
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

  testNavigation(e) {
    const college = e.currentTarget.dataset.college;
    
    wx.showModal({
      title: '调试信息',
      content: `点击学院: ${college}`,
      success: (res) => {
        if (res.confirm) {
          // 使用最简单的导航测试
          wx.navigateTo({
            url: '/pages/courses/index',
            success: () => {
              wx.showToast({ title: '导航成功' });
            },
            fail: (err) => {
              wx.showModal({
                title: '导航失败',
                content: JSON.stringify(err),
                showCancel: false
              });
            }
          });
        }
      }
    });
  }
});