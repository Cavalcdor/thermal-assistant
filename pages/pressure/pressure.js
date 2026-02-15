// pages/pressure/pressure.js
const Decimal = require('../../utils/decimal.js');
const app = getApp();

const generateNextNo = (currentNo) => {
  if (!currentNo) return '';
  const match = currentNo.match(/(\d+)$/);
  if (match) {
    const numStr = match[1];
    const nextNum = parseInt(numStr) + 1;
    const paddedNum = nextNum.toString().padStart(numStr.length, '0');
    return currentNo.substring(0, currentNo.length - numStr.length) + paddedNum;
  }
  return currentNo;
};

const createTabState = () => ({
  deviceNo: '',
  rangeMin: '0',
  rangeMax: '',
  accuracy: '',
  allowedError: '0.000',
  overallResult: '',
  points: [{ standard: '', upValue: '', downValue: '', theory: '-', upError: '', downError: '', hysteresis: '', finalResult: '' }]
});

Page({
  data: {
    currentTab: 0,
    tabs: [createTabState(), createTabState()]
  },

  onLoad() { this.suggestNextNo(); },

  onShow() {
    const restoreData = wx.getStorageSync('restore_data');
    if (restoreData && restoreData.type === 'pressure') {
      const idx = restoreData.rawData.currentTab || 0;
      this.setData({
        currentTab: idx,
        [`tabs[${idx}]`]: restoreData.rawData
      }, () => {
        this.calculateParams();
      });
      wx.removeStorageSync('restore_data');
    }
  },

  suggestNextNo() {
    const history = app.globalData.history || [];
    const lastRecord = [...history].reverse().find(item => item.type === 'pressure');
    if (lastRecord && lastRecord.rawData && lastRecord.rawData.deviceNo) {
      const nextNo = generateNextNo(lastRecord.rawData.deviceNo);
      this.setData({ 'tabs[0].deviceNo': nextNo, 'tabs[1].deviceNo': nextNo });
    }
  },

  switchTab(e) {
    const idx = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentTab: idx }, () => { this.calculateParams(); });
  },

  // 改进：输入时仅修改当前Tab编号，保存后才全局递增
  onDeviceNoInput(e) { 
    this.setData({ [`tabs[${this.data.currentTab}].deviceNo`]: e.detail.value });
  },

  onRangeMinInput(e) { this.updateTabField('rangeMin', e.detail.value, true); },
  onRangeMaxInput(e) { this.updateTabField('rangeMax', e.detail.value, true); },
  onAccuracyInput(e) { this.updateTabField('accuracy', e.detail.value, true); },

  updateTabField(field, value, triggerCalc = false) {
    const idx = this.data.currentTab;
    this.setData({ [`tabs[${idx}].${field}`]: value }, () => {
      if (triggerCalc) this.calculateParams();
    });
  },

  calcTheory(stdVal) {
    if (stdVal === '' || isNaN(stdVal)) return '-';
    const idx = this.data.currentTab;
    const tab = this.data.tabs[idx];
    if (idx === 0) return parseFloat(stdVal).toFixed(2);
    try {
      if (tab.rangeMax === '') return '-';
      const min = new Decimal(tab.rangeMin || 0);
      const max = new Decimal(tab.rangeMax);
      const span = max.minus(min);
      if (span.toNumber() === 0) return '-'; // 量程非法时不计算
      const res = new Decimal(stdVal).minus(min).dividedBy(span).times(16).plus(4);
      return res.toFixed(3);
    } catch (e) { return '-'; }
  },

  calculateParams() {
    const idx = this.data.currentTab;
    const tab = this.data.tabs[idx];
    if (tab.rangeMax === '' || tab.accuracy === '') return;
    try {
      const min = new Decimal(tab.rangeMin || 0);
      const max = new Decimal(tab.rangeMax);
      const acc = new Decimal(tab.accuracy);
      const span = max.minus(min).abs();
      let errorLimit = (idx === 0) ? span.times(acc).dividedBy(100) : new Decimal(16).times(acc).dividedBy(100);
      this.setData({ [`tabs[${idx}].allowedError`]: errorLimit.toFixed(3) }, () => { this.reCheckAllPoints(); });
    } catch (e) {}
  },

  reCheckAllPoints() {
    this.data.tabs[this.data.currentTab].points.forEach((_, i) => this.calculateRow(i));
  },

  // 改进：使用 Decimal 处理步进，防止浮点数误差
  generateStandardPoints() {
    const idx = this.data.currentTab;
    const tab = this.data.tabs[idx];
    if (tab.rangeMax === '') return;
    try {
      const min = new Decimal(tab.rangeMin || 0);
      const max = new Decimal(tab.rangeMax);
      const step = max.minus(min).dividedBy(4);
      let newPoints = [];
      for (let i = 0; i <= 4; i++) {
        let stdVal = min.plus(step.times(i)).toNumber().toFixed(2);
        newPoints.push({ standard: stdVal, theory: this.calcTheory(stdVal), upValue: '', downValue: '', upError: '', downError: '', hysteresis: '', finalResult: '' });
      }
      this.setData({ [`tabs[${idx}].points`]: newPoints }, () => this.updateOverallConclusion());
    } catch(e) {}
  },

  onStandardInput(e) {
    const pIdx = e.currentTarget.dataset.index;
    const tIdx = this.data.currentTab;
    const val = e.detail.value;
    this.setData({ [`tabs[${tIdx}].points[${pIdx}].standard`]: val, [`tabs[${tIdx}].points[${pIdx}].theory`]: this.calcTheory(val) }, () => this.calculateRow(pIdx));
  },

  onUpInput(e) { this.updateCell(e.currentTarget.dataset.index, 'upValue', e.detail.value); },
  onDownInput(e) { this.updateCell(e.currentTarget.dataset.index, 'downValue', e.detail.value); },

  updateCell(pIdx, field, val) {
    const tIdx = this.data.currentTab;
    this.setData({ [`tabs[${tIdx}].points[${pIdx}].${field}`]: val }, () => this.calculateRow(pIdx));
  },

  calculateRow(pIdx) {
    const tIdx = this.data.currentTab;
    const tab = this.data.tabs[tIdx];
    let p = tab.points[pIdx];
    p.theory = this.calcTheory(p.standard);
    if (p.standard === '' || p.theory === '-' || !tab.allowedError) {
      this.setData({ [`tabs[${tIdx}].points[${pIdx}]`]: p }); return;
    }
    try {
      const theoryVal = new Decimal(p.theory);
      const limit = parseFloat(tab.allowedError);
      if (p.upValue !== '') {
        const diff = new Decimal(p.upValue).minus(theoryVal);
        p.upError = diff.toFixed(3);
        p.resultUp = diff.abs().toNumber() <= limit ? 'pass' : 'fail';
      }
      if (p.downValue !== '') {
        const diff = new Decimal(p.downValue).minus(theoryVal);
        p.downError = diff.toFixed(3);
        p.resultDown = diff.abs().toNumber() <= limit ? 'pass' : 'fail';
      }
      if (p.upValue !== '' && p.downValue !== '') {
        const hys = new Decimal(p.upValue).minus(p.downValue).abs();
        p.hysteresis = hys.toFixed(3);
        p.hysResult = hys.toNumber() <= limit ? 'pass' : 'fail';
      }
      if (p.resultUp === 'fail' || p.resultDown === 'fail' || p.hysResult === 'fail') {
        p.finalResult = 'fail';
      } else if (p.upValue !== '' && p.downValue !== '' && p.resultUp === 'pass' && p.resultDown === 'pass') {
        p.finalResult = 'pass';
      } else { p.finalResult = ''; }
      this.setData({ [`tabs[${tIdx}].points[${pIdx}]`]: p }, () => this.updateOverallConclusion());
    } catch (e) {}
  },

  updateOverallConclusion() {
    const idx = this.data.currentTab;
    const points = this.data.tabs[idx].points.filter(p => p.standard !== '');
    if (points.length === 0) { this.setData({ [`tabs[${idx}].overallResult`]: '' }); return; }
    const hasFail = points.some(p => p.finalResult === 'fail');
    const allPass = points.every(p => p.finalResult === 'pass');
    let res = hasFail ? 'fail' : (allPass ? 'pass' : '');
    this.setData({ [`tabs[${idx}].overallResult`]: res });
    if (res === 'fail' && app.globalData.settings?.vibrationEnabled !== false) wx.vibrateShort();
  },

  addPoint() {
    const idx = this.data.currentTab;
    let points = this.data.tabs[idx].points;
    points.push({ standard: '', upValue: '', downValue: '', theory: '-', finalResult: '' });
    this.setData({ [`tabs[${idx}].points`]: points });
  },

  deletePoint(e) {
    const pIdx = e.currentTarget.dataset.index;
    const tIdx = this.data.currentTab;
    let points = this.data.tabs[tIdx].points;
    points.splice(pIdx, 1);
    this.setData({ [`tabs[${tIdx}].points`]: points }, () => this.updateOverallConclusion());
  },

  clearPoints() {
    const idx = this.data.currentTab;
    this.setData({
      [`tabs[${idx}].points`]: [{ standard: '', upValue: '', downValue: '', theory: '-', finalResult: '' }],
      [`tabs[${idx}].overallResult`]: ''
    });
  },

  clearAll() {
    const idx = this.data.currentTab;
    const oldNo = this.data.tabs[idx].deviceNo;
    this.setData({ [`tabs[${idx}]`]: createTabState() }, () => {
      this.setData({ [`tabs[${idx}].deviceNo`]: oldNo });
    });
  },

  saveRecord() {
    const idx = this.data.currentTab;
    const tab = this.data.tabs[idx];
    if (!tab.overallResult) { wx.showToast({ title: '校验未完成', icon: 'none' }); return; }
    
    const unit = idx === 0 ? 'MPa' : 'kPa';
    const errUnit = idx === 0 ? 'MPa' : 'mA';

    const record = {
      type: 'pressure',
      title: idx === 0 ? '压力表校验' : '变送器校验',
      subTitle: tab.deviceNo ? `编号: ${tab.deviceNo}` : '无编号',
      desc: `${tab.rangeMin}~${tab.rangeMax}${unit} | ${tab.accuracy}级`,
      result: tab.overallResult,
      // 改进：增加量程和精度详情，让历史记录真正有用
      details: [
        { label: '仪表类型', value: idx === 0 ? '压力表' : '变送器' },
        { label: '仪表编号', value: tab.deviceNo || '-' },
        { label: '量程范围', value: `${tab.rangeMin} ~ ${tab.rangeMax} ${unit}` },
        { label: '精度等级', value: `${tab.accuracy} 级` },
        { label: '允许误差', value: `±${tab.allowedError} ${errUnit}` }
      ],
      tableData: tab.points.filter(p => p.standard !== '').map(p => ({
        standard: p.standard, theory: p.theory, valUp: p.upValue, valDown: p.downValue, 
        errUp: p.upError, errDown: p.downError, hysteresis: p.hysteresis, result: p.finalResult
      })),
      rawData: { ...tab, currentTab: idx }
    };
    app.addHistory(record);
    
    const nextNo = generateNextNo(tab.deviceNo);
    this.setData({ 'tabs[0].deviceNo': nextNo, 'tabs[1].deviceNo': nextNo });
    wx.showToast({ title: '保存成功', icon: 'success' });
  }
});