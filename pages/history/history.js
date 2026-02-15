// pages/history/history.js
const app = getApp();

Page({
  data: {
    filterType: 'all',
    historyList: [],
    displayList: []
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const raw = app.globalData.history || [];
    const list = raw.map((item, index) => ({
      ...item,
      originalIndex: index,
      typeLabel: this.getTypeLabel(item.type),
      timeLabel: this.formatTime(item.time || item.timestamp)
    })).reverse(); // 展示用反转

    this.setData({ historyList: list });
    this.filterHistory();
  },

  // 恢复数据
  restoreRecord(e) {
    const originalIndex = e.currentTarget.dataset.index;
    const item = app.globalData.history[originalIndex];
    if (!item) return;

    wx.setStorageSync('restore_data', item);

    let url = '';
    switch (item.type) {
      case 'pressure': url = '/pages/pressure/pressure'; break;
      case 'thermal': url = '/pages/thermal/thermal'; break;
      case 'unit_conversion':
      case 'cems': url = '/pages/tools/tools'; break;
    }

    if (url) {
      wx.switchTab({ url });
    }
  },

  getTypeLabel(type) {
    const map = { 'thermal': '温度', 'pressure': '压力'};
    return map[type] || '其他';
  },

  formatTime(ts) {
    const date = new Date(ts);
    return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
  },

  filterHistory() {
    const { filterType, historyList } = this.data;
    let list = filterType === 'all' ? historyList : 
               filterType === 'tools' ? historyList.filter(i => ['unit_conversion', 'cems'].includes(i.type)) :
               historyList.filter(i => i.type === filterType);
    this.setData({ displayList: list });
  },

  changeFilter(e) {
    this.setData({ filterType: e.currentTarget.dataset.type });
    this.filterHistory();
  },

  goToDetail(e) {
    const idx = e.currentTarget.dataset.index;
    wx.navigateTo({ url: `/pages/history/detail/detail?index=${idx}` });
  },

  deleteHistory(e) {
    const idx = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      success: (res) => {
        if (res.confirm) {
          app.deleteHistory(idx);
          this.loadHistory();
        }
      }
    });
  },

  clearAllHistory() {
    wx.showModal({
      title: '警告',
      content: '确定清空吗？',
      confirmColor: '#D9001B',
      success: (res) => {
        if (res.confirm) {
          app.clearHistory();
          this.loadHistory();
        }
      }
    });
  }
});