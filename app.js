// app.js
App({
  onLaunch() {
    const history = wx.getStorageSync('calculation_history') || [];
    this.globalData.history = history;
    const settings = wx.getStorageSync('app_settings') || {
      thermocoupleDecimals: 3,
      rtdDecimals: 2,
      pressureDecimals: 3,
      vibrationEnabled: true
    };
    this.globalData.settings = settings;
  },

  globalData: {
    history: [],
    settings: {},
    maxHistoryLength: 50
  },

  addHistory(record) {
    record.timestamp = Date.now();
    // 使用 push，新记录在最后，展示时再反转，索引更稳定
    this.globalData.history.push(record);
    if (this.globalData.history.length > this.globalData.maxHistoryLength) {
      this.globalData.history.shift(); // 删掉最早的一条
    }
    wx.setStorageSync('calculation_history', this.globalData.history);
  },

  deleteHistory(index) {
    this.globalData.history.splice(index, 1);
    wx.setStorageSync('calculation_history', this.globalData.history);
  },

  clearHistory() {
    this.globalData.history = [];
    wx.setStorageSync('calculation_history', []);
  }
});