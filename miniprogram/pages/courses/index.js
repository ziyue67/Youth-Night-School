// 课程页面逻辑（按月份从MySQL加载）
Page({
  data: {
    currentCollege: '建筑工程学院',
    courses: [],
    months: [],
    currentMonth: null,
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
    let selectedCollege = '建筑工程学院';
    if (options && options.college) {
      selectedCollege = decodeURIComponent(options.college);
    } else if (wx.getStorageSync('selectedCollege')) {
      selectedCollege = wx.getStorageSync('selectedCollege');
    }
    this.setData({ currentCollege: selectedCollege });
    this.loadMonthsAndCourses();
  },

  onShow() {
    const stored = wx.getStorageSync('selectedCollege');
    const college = stored || this.data.currentCollege;
    if (college !== this.data.currentCollege) {
      this.setData({ currentCollege: college });
    }
    this.loadMonthsAndCourses();
  },

  // 加载月份并拉取当前月份课程
  async loadMonthsAndCourses() {
    try {
      const mres = await wx.cloud.callFunction({ name: 'courseSchedule', data: { action: 'months', college: this.data.currentCollege } });
      const months = (mres.result && mres.result.months) ? mres.result.months : [];
      const currentMonth = months.length ? months[0] : null;
      this.setData({ months, currentMonth });
      if (currentMonth) {
        await this.loadCourses(currentMonth);
      } else {
        this.setData({ courses: [] });
      }
    } catch (e) {
      this.setData({ months: [], currentMonth: null, courses: [] });
    }
  },

  // 拉取课程列表
  async loadCourses(month) {
    try {
      const res = await wx.cloud.callFunction({ name: 'courseSchedule', data: { action: 'list', college: this.data.currentCollege, month } });
      const courses = (res.result && res.result.courses) ? res.result.courses : [];
      this.setData({ courses });
    } catch (e) {
      this.setData({ courses: [] });
    }
  },

  // 月份点击
  onMonthTap(e) {
    const month = Number(e.currentTarget.dataset.month);
    if (!month || month === this.data.currentMonth) return;
    this.setData({ currentMonth: month });
    this.loadCourses(month);
  },

  // 切换学院
  switchCollege(e) {
    const college = e.currentTarget.dataset.college;
    this.setData({ currentCollege: college });
    wx.setStorageSync('selectedCollege', college);
    this.loadMonthsAndCourses();
  }
});
