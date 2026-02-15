// pages/history/detail/detail.js
const app = getApp();

Page({
  data: {
    record: {}
  },

  onLoad(options) {
    const index = options.index;
    if (index !== undefined && app.globalData.history) {
      const item = app.globalData.history[index];
      if (item) {
        const date = new Date(item.time || item.timestamp);
        const timeLabel = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2,'0')}`;
        this.setData({
          record: { ...item, timeLabel, originalIndex: index }
        });
        wx.setNavigationBarTitle({ title: item.title || '记录详情' });
      }
    }
  },

  // 直接触发恢复，不再依赖上一页的方法
  onRestore() {
    const { record } = this.data;
    if (!record) return;

    wx.setStorageSync('restore_data', record);

    let url = '';
    switch (record.type) {
      case 'pressure': url = '/pages/pressure/pressure'; break;
      case 'thermal': url = '/pages/thermal/thermal'; break;
      case 'unit_conversion':
      case 'cems': url = '/pages/tools/tools'; break;
    }

    if (url) {
      wx.switchTab({ url });
    }
  }
});