const app = getApp();

Page({
  data: {
    recentList: [],
    totalCount: 0
  },

  onShow() {
    this.loadRecentHistory();
  },

  loadRecentHistory() {
    const history = app.globalData.history || [];
    this.setData({ totalCount: history.length });

    const recent = history.slice(-5).reverse().map((item, index) => {
      const realIndex = history.length - 1 - index;
      return {
        ...item,
        originalIndex: realIndex,
        typeLabel: this.getTypeLabel(item.type),
        timeLabel: this.formatTime(item.time || item.timestamp),
        displayTitle: item.title || this.getLegacyTitle(item),
        displayDesc: item.desc || item.subTitle || item.content || '查看详情'
      };
    });
    this.setData({ recentList: recent });
  },

  goToHistoryTab() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goToDetail(e) {
    const index = e.currentTarget.dataset.index;
    wx.navigateTo({ url: `/pages/history/detail/detail?index=${index}` });
  },

  deleteHistory(e) {
    const index = e.currentTarget.dataset.index;
    wx.showModal({
      title: '确认删除',
      content: '是否删除这条记录？',
      success: (res) => {
        if (res.confirm) {
          app.deleteHistory(index);
          this.loadRecentHistory();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  },

  clearAllHistory() {
    if (this.data.totalCount === 0) return;
    wx.showModal({
      title: '警示',
      content: '确定清空所有历史记录吗？',
      confirmColor: '#D9001B',
      success: (res) => {
        if (res.confirm) {
          app.clearHistory();
          this.loadRecentHistory();
        }
      }
    });
  },

  getTypeLabel(type) {
    const map = { 'thermal': '温度', 'pressure': '压力', 'unit_conversion': '换算', 'cems': 'CEMS' };
    return map[type] || '记录';
  },

  formatTime(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  getLegacyTitle(item) {
    if (item.type === 'thermal') return `${item.subType} 计算`;
    if (item.type === 'cems') return 'CEMS 换算';
    return '计算记录';
  }
});