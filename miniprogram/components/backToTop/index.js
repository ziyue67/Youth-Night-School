Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 滚动多少距离后显示按钮，单位rpx
    scrollTop: {
      type: Number,
      value: 500
    },
    // 按钮位置，right/bottom
    position: {
      type: Object,
      value: {
        right: 30,
        bottom: 100
      }
    },
    // 按钮大小
    size: {
      type: Number,
      value: 80
    },
    // 按钮图标
    icon: {
      type: String,
      value: '↑'
    },
    // 按钮背景色
    bgColor: {
      type: String,
      value: '#667eea'
    },
    // 按钮文字颜色
    color: {
      type: String,
      value: '#ffffff'
    },
    // 是否显示动画
    animation: {
      type: Boolean,
      value: true
    },
    // 是否显示按钮（由页面控制）
    show: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isAnimating: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 回到顶部
    backToTop() {
      if (this.data.isAnimating) return;
      
      this.setData({ isAnimating: true });
      
      // 直接在组件内调用滚动API，同时通知页面
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 500,
        success: () => {
          this.setData({ isAnimating: false });
          this.triggerEvent('scrollComplete');
        },
        fail: (err) => {
          this.setData({ isAnimating: false });
          this.triggerEvent('scrollFail', { error: err });
          wx.showToast({
            title: '回到顶部失败',
            icon: 'none'
          });
        }
      });
      
      // 同时通知页面
      this.triggerEvent('backToTop');
    },

    // 防止事件冒泡
    stopPropagation() {
      // 阻止事件冒泡
    }
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 组件挂载时初始化
    },

    detached() {
      // 组件销毁时清理
    }
  }
})