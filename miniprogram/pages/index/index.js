const { COLLEGES, navigateToPage, storage } = require('../../utils/common');

// 首页逻辑 - 优化后减少冗余
Page({
  data: {
    currentTab: 0,
    recentCourses: [
      {
        id: 1,
        name: "高数答疑",
        time: "周一 19:30-21:00",
        location: "教学楼A305",
        image: "../../images/ai_example1.png"
      },
      {
        id: 2,
        name: "摄影入门",
        time: "周三 19:00-20:30",
        location: "艺术楼B102",
        image: "../../images/ai_example2.png"
      },
      {
        id: 3,
        name: "英语口语",
        time: "周五 19:30-21:00",
        location: "外语楼C203",
        image: "../../images/cloud_dev.png"
      }
    ]
  },

  onLoad() {
    console.log("=== 首页加载 ===");
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

  // 更多按钮点击事件 - 使用通用函数
  onMoreTap() {
    navigateToPage("/pages/courses/index", 'switchTab:/pages/courses/index');
  },

  // 关于我们按钮点击事件 - 使用通用函数
  onAboutTap() {
    navigateToPage("/pages/about/index");
  }
});