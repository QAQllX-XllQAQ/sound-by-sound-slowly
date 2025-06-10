// index.js
Page({
  data: {
    // 用户签到数据
    signInData: [],
    // 当前日期
    today: new Date(),
    // 当前选择的年月
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    // 连续学习天数
    consecutiveDays: 0,
    // 学习总天数
    totalDays: 0,
    // 本月学习天数
    monthDays: 0,
    // 日历数据
    calendarDays: [],
    // 今日是否已签到
    isTodaySignIn: false
  },

  onLoad: function() {
    // 确保today是一个正确的Date对象
    this.setData({
      today: new Date()
    }, () => {
      this.initCalendar();
      this.loadSignInData();
    });
  },

  onShow: function() {
    // 确保today是最新的日期
    this.setData({
      today: new Date()
    }, () => {
      this.loadSignInData();
    });
  },

  // 初始化日历数据
  initCalendar: function() {
    const days = [];
    const year = this.data.currentYear;
    const month = this.data.currentMonth;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    
    // 填充前面的空白
    for (let i = 0; i < firstDay; i++) {
      days.push({
        day: '',
        isToday: false,
        isSignIn: false,
        date: ''
      });
    }
    
    // 填充日期
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month - 1, i);
      const dateStr = this.formatDate(date);
      days.push({
        day: i,
        isToday: this.isSameDay(date, this.data.today),
        isSignIn: false,
        date: dateStr
      });
    }
    
    this.setData({
      calendarDays: days
    });
  },

  // 加载签到数据
  loadSignInData: function() {
    const signInData = wx.getStorageSync('signInData') || [];
    
    // 更新日历上的签到状态
    const calendarDays = this.data.calendarDays;
    let consecutiveDays = 0;
    let totalDays = signInData.length;
    let monthDays = 0;
    
    // 确保today是一个有效的Date对象
    const today = new Date();
    const todayStr = this.formatDate(today);
    const isTodaySignIn = signInData.includes(todayStr);
    
    // 计算本月学习天数
    signInData.forEach(dateStr => {
      try {
        const date = new Date(dateStr);
        if (date.getFullYear() === this.data.currentYear && 
            date.getMonth() + 1 === this.data.currentMonth) {
          monthDays++;
        }
      } catch(e) {
        console.error('无效的日期字符串:', dateStr, e);
      }
    });
    
    // 计算连续学习天数
    if (signInData.length > 0) {
      try {
        const sortedDates = [...signInData].sort((a, b) => new Date(b) - new Date(a));
        let lastDate = new Date(sortedDates[0]);
        consecutiveDays = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
          const currentDate = new Date(sortedDates[i]);
          const diffDays = Math.floor((lastDate - currentDate) / (24 * 3600 * 1000));
          
          if (diffDays === 1) {
            consecutiveDays++;
            lastDate = currentDate;
          } else {
            break;
          }
        }
      } catch(e) {
        console.error('计算连续天数时出错:', e);
        consecutiveDays = 0;
      }
    }
    
    // 更新日历签到状态
    for (let i = 0; i < calendarDays.length; i++) {
      if (calendarDays[i].date && signInData.includes(calendarDays[i].date)) {
        calendarDays[i].isSignIn = true;
      }
    }
    
    this.setData({
      signInData,
      calendarDays,
      consecutiveDays,
      totalDays,
      monthDays,
      isTodaySignIn
    });
  },

  // 签到功能
  signIn: function() {
    // 确保使用新的Date对象
    const today = new Date();
    const todayStr = this.formatDate(today);
    let signInData = wx.getStorageSync('signInData') || [];
    
    // 检查是否已经签到
    if (!signInData.includes(todayStr)) {
      signInData.push(todayStr);
      wx.setStorageSync('signInData', signInData);
      
      wx.showToast({
        title: '签到成功！',
        icon: 'success'
      });
      
      this.loadSignInData();
    } else {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      });
    }
  },

  // 切换月份
  changeMonth: function(e) {
    const direction = e.currentTarget.dataset.direction;
    let { currentYear, currentMonth } = this.data;
    
    if (direction === 'prev') {
      if (currentMonth === 1) {
        currentMonth = 12;
        currentYear--;
      } else {
        currentMonth--;
      }
    } else {
      if (currentMonth === 12) {
        currentMonth = 1;
        currentYear++;
      } else {
        currentMonth++;
      }
    }
    
    this.setData({
      currentYear,
      currentMonth
    }, () => {
      this.initCalendar();
      this.loadSignInData();
    });
  },

  // 格式化日期为 yyyy-MM-dd
  formatDate: function(date) {
    if (!(date instanceof Date)) {
      console.error('formatDate接收到无效的日期对象:', date);
      date = new Date(); // 使用当前日期作为备用
    }
    
    try {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      console.error('格式化日期出错:', e);
      return '';
    }
  },

  // 判断两个日期是否为同一天
  isSameDay: function(date1, date2) {
    try {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    } catch (e) {
      console.error('比较日期出错:', e);
      return false;
    }
  },

  // 跳转到学习页面
  navigateToLearning: function() {
    wx.switchTab({
      url: '/pages/learning/learning'
    });
  }
})
