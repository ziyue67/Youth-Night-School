// 首页逻辑 - 紧急修复所有跳转失败
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

  // 学院卡片点击事件 - 彻底修复跳转映射
  onCollegeTap(e) {
    const college = e.currentTarget.dataset.college;
    console.log("=== 点击学院卡片 ===");
    console.log("学院名称:", college);
    
    // 验证学院名称有效性
    const validColleges = [
      '建筑工程学院',
      '智能制造与电梯学院', 
      '新能源工程与汽车学院',
      '信息工程与物联网学院',
      '经济管理与电商学院',
      '旅游管理学院',
      '艺术设计与时尚创意学院',
      '社会发展与公共教育学院'
    ];
    
    if (!validColleges.includes(college)) {
      console.error("❌ 无效的学院名称:", college);
      wx.showToast({
        title: '学院信息错误',
        icon: 'none'
      });
      return;
    }
    
    // 优先使用switchTab（courses页面是tab页面）
    wx.setStorageSync('selectedCollege', college);
    wx.setStorageSync('collegeTimestamp', Date.now());
    
    wx.switchTab({
      url: '/pages/courses/index',
      success: () => {
        console.log("✅ switchTab跳转成功，学院:", college);
      },
      fail: (err) => {
        console.error("❌ switchTab失败，尝试navigateTo:", err);
        // 降级方案：使用navigateTo
        wx.navigateTo({
          url: `/pages/courses/index?college=${encodeURIComponent(college)}`,
          success: () => {
            console.log("✅ navigateTo跳转成功");
          },
          fail: (err2) => {
            console.error("❌ 所有跳转方式失败:", err2);
            wx.showModal({
              title: '提示',
              content: '跳转失败，请手动进入课程页面',
              showCancel: false
            });
          }
        });
      }
    });
  },

  // 更多按钮点击事件
  onMoreTap() {
    wx.navigateTo({
      url: "/pages/courses/index",
      fail: () => {
        wx.switchTab({
          url: '/pages/courses/index'
        });
      }
    });
  },

  // 关于我们按钮点击事件
  onAboutTap() {
    wx.navigateTo({
      url: "/pages/about/index"
    });
  }
});