const { COLLEGES, callCloudFunction, storage } = require('../../utils/common');

// 课程页面逻辑（按月份从MySQL加载）- 优化后减少冗余
Page({
  data: {
    currentCollege: '建筑工程学院',
    courses: [],
    months: [],
    currentMonth: null,
    searchKeyword: '',
    searchResults: [],
    scrollTarget: '',
    highlightCourseId: null,
    colleges: COLLEGES // 使用常量
  },

  onLoad(options) {
    let selectedCollege = '建筑工程学院';
    if (options && options.college) {
      selectedCollege = decodeURIComponent(options.college);
    } else {
      selectedCollege = storage.get('selectedCollege', '建筑工程学院');
    }
    this.setData({ currentCollege: selectedCollege });
    this.loadMonthsAndCourses();
  },

  onShow() {
    const stored = storage.get('selectedCollege');
    const college = stored || this.data.currentCollege;
    if (college !== this.data.currentCollege) {
      this.setData({ currentCollege: college });
    }
    this.loadMonthsAndCourses();
  },

  // 加载月份并拉取当前月份课程 - 使用通用云函数调用
  async loadMonthsAndCourses() {
    try {
      const mres = await callCloudFunction('courseSchedule', {
        action: 'months',
        college: this.data.currentCollege
      }, false);
      
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

  // 拉取课程列表 - 使用通用云函数调用
  async loadCourses(month) {
    try {
      const res = await callCloudFunction('courseSchedule', {
        action: 'list',
        college: this.data.currentCollege,
        month
      }, false);
      
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

  // 切换学院 - 使用通用存储
  switchCollege(e) {
    const college = e.currentTarget.dataset.college;
    this.setData({ currentCollege: college });
    storage.set('selectedCollege', college);
    this.loadMonthsAndCourses();
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value || '' });
  },

  // 搜索确认 - 使用通用云函数调用
  async onSearchConfirm() {
    const keyword = (this.data.searchKeyword || '').trim();
    if (!keyword) {
      this.setData({ searchResults: [] });
      return;
    }
    
    try {
      const res = await callCloudFunction('courseSchedule', {
        action: 'search',
        keyword
      }, false);
      
      const results = (res.result && res.result.results) ? res.result.results : [];
      this.setData({ searchResults: results.slice(0, 50) });
      
      if (results.length === 1) {
        this.applySearchChoice({
          currentTarget: {
            dataset: {
              college: results[0].college,
              month: results[0].month,
              id: results[0].id
            }
          }
        });
      }
    } catch (e) {
      this.setData({ searchResults: [] });
    }
  },

  async applySearchChoice(e) {
    const { college, month, id } = e.currentTarget.dataset;
    if (!college || !month || !id) return;
    
    this.setData({
      currentCollege: college,
      currentMonth: Number(month),
      searchResults: []
    });
    
    storage.set('selectedCollege', college);
    await this.loadCourses(Number(month));
    
    this.setData({
      scrollTarget: `course-item-${id}`,
      highlightCourseId: id
    });
    
    setTimeout(() => {
      this.setData({ highlightCourseId: null });
    }, 2000);
  }
});
