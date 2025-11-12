// 课程页面逻辑 - 最终修复版本
Page({
  data: {
    currentCollege: '建筑工程学院',
    courses: [],
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

  onLoad(options) {
    console.log("=== 课程页面加载 ===");
    
    // 处理参数优先级：URL参数 > 本地存储 > 默认
    let selectedCollege = '建筑工程学院';
    
    if (options && options.college) {
      selectedCollege = decodeURIComponent(options.college);
    } else if (wx.getStorageSync('selectedCollege')) {
      selectedCollege = wx.getStorageSync('selectedCollege');
    }
    
    console.log("当前学院:", selectedCollege);
    this.setData({ currentCollege: selectedCollege });
    this.loadCourses(selectedCollege);
  },

  onShow() {
    // 支持通过本地存储切换学院
    if (wx.getStorageSync('selectedCollege')) {
      const college = wx.getStorageSync('selectedCollege');
      if (college !== this.data.currentCollege) {
        this.setData({ currentCollege: college });
        this.loadCourses(college);
      }
    }
  },

  // 切换学院
  switchCollege(e) {
    const college = e.currentTarget.dataset.college;
    console.log("切换学院:", college);
    
    this.setData({ currentCollege: college });
    wx.setStorageSync('selectedCollege', college);
    this.loadCourses(college);
  },

  // 加载课程数据
  loadCourses(college) {
    console.log("加载课程:", college);
    const courses = require('./courses-data.js')[college] || [];
    this.setData({ courses });
  }
});
