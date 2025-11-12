// 调试工具 - 测试卡片跳转
Page({
  data: {
    testMessage: "点击测试按钮开始调试"
  },

  // 调试学院卡片跳转
  onCollegeDebug(e) {
    console.log("=== 调试开始 ===");
    console.log("点击事件:", e);
    console.log("学院名称:", e.currentTarget.dataset.college);
    console.log("当前页面路径:", getCurrentPages()[0].route);
    
    try {
      const college = e.currentTarget.dataset.college;
      
      // 测试1：检查页面是否存在
      console.log("测试1 - 检查页面是否存在");
      const pages = getCurrentPages();
      console.log("已加载页面:", pages.map(p => p.route));
      
      // 测试2：检查目标页面路径
      console.log("测试2 - 检查目标路径");
      const targetUrl = `/pages/courses/index?college=${encodeURIComponent(college)}`;
      console.log("目标URL:", targetUrl);
      
      // 测试3：尝试跳转
      console.log("测试3 - 执行跳转");
      wx.navigateTo({
        url: targetUrl,
        success: () => {
          console.log("跳转成功");
          this.setData({ testMessage: "跳转成功！" });
        },
        fail: (err) => {
          console.error("跳转失败:", err);
          this.setData({ testMessage: "跳转失败: " + JSON.stringify(err) });
        }
      });
      
    } catch (error) {
      console.error("调试异常:", error);
      this.setData({ testMessage: "调试异常: " + error.message });
    }
  }
});