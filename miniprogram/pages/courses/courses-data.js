// 课程数据文件 - 修复学院数据映射
const courseData = {
  // 建筑工程学院
  '建筑工程学院': [
    { id: 1, name: '建筑制图基础', time: '周一 19:30-21:00', teacher: '张工', status: 'available' },
    { id: 2, name: '工程力学基础', time: '周二 19:00-20:30', teacher: '李工', status: 'full' },
    { id: 3, name: '建筑材料应用', time: '周三 19:30-21:00', teacher: '王工', status: 'available' }
  ],

  // 智能制造与电梯学院
  '智能制造与电梯学院': [
    { id: 4, name: '机械设计基础(智能制造)', time: '周一 19:30-21:00', teacher: '刘工', status: 'available' },
    { id: 5, name: '数控技术与应用(智能制造)', time: '周三 19:00-20:30', teacher: '赵工', status: 'available' },
    { id: 6, name: '电梯安全规范(电梯)', time: '周四 19:30-21:00', teacher: '陈工', status: 'available' }
  ],

  // 新能源工程与汽车学院
  '新能源工程与汽车学院': [
    { id: 7, name: '新能源汽车技术(新能源)', time: '周二 19:30-21:00', teacher: '孙工', status: 'full' },
    { id: 8, name: '汽车电子系统(汽车)', time: '周四 19:00-20:30', teacher: '钱工', status: 'available' },
    { id: 9, name: '动力电池技术(新能源)', time: '周五 19:30-21:00', teacher: '周工', status: 'available' }
  ],

  // 信息工程与物联网学院
  '信息工程与物联网学院': [
    { id: 10, name: '物联网基础(信息工程)', time: '周一 19:30-21:00', teacher: '吴工', status: 'available' },
    { id: 11, name: '编程入门教程(物联网)', time: '周二 19:00-20:30', teacher: '郑工', status: 'available' },
    { id: 12, name: '网络技术应用(信息工程)', time: '周三 19:30-21:00', teacher: '冯工', status: 'available' }
  ],

  // 经济管理与电商学院
  '经济管理与电商学院': [
    { id: 13, name: '经济学基础(经济管理)', time: '周二 19:30-21:00', teacher: '何工', status: 'available' },
    { id: 14, name: '电商运营实战(电商)', time: '周四 19:00-20:30', teacher: '马工', status: 'available' },
    { id: 15, name: '市场营销策略(经济管理)', time: '周五 19:30-21:00', teacher: '田工', status: 'available' }
  ],

  // 旅游管理学院
  '旅游管理学院': [
    { id: 16, name: '旅游概论(旅游管理)', time: '周一 19:30-21:00', teacher: '韩工', status: 'available' },
    { id: 17, name: '酒店管理实务(旅游)', time: '周三 19:00-20:30', teacher: '杨工', status: 'available' },
    { id: 18, name: '导游实务操作(旅游管理)', time: '周五 19:30-21:00', teacher: '蔡工', status: 'available' }
  ],

  // 艺术设计与时尚创意学院
  '艺术设计与时尚创意学院': [
    { id: 19, name: '设计基础入门(艺术设计)', time: '周二 19:30-21:00', teacher: '胡工', status: 'available' },
    { id: 20, name: '摄影技巧提升(时尚创意)', time: '周四 19:00-20:30', teacher: '林工', status: 'available' },
    { id: 21, name: '时尚搭配实践(时尚创意)', time: '周六 19:30-21:00', teacher: '谢工', status: 'available' }
  ],

  // 社会发展与公共教育学院
  '社会发展与公共教育学院': [
    { id: 22, name: '社会学基础(社会教育)', time: '周三 19:30-21:00', teacher: '唐工', status: 'available' },
    { id: 23, name: '公共管理实务(社会教育)', time: '周五 19:00-20:30', teacher: '徐工', status: 'available' },
    { id: 24, name: '教育心理学应用(社会教育)', time: '周日 19:30-21:00', teacher: '高工', status: 'available' }
  ]
};

module.exports = courseData;