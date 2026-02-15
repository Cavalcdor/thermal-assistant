const Decimal = require('../../utils/decimal.js');
const app = getApp();

Page({
  data: {
    activeTab: 'unit',
    unitType: 'pressure',
    // 1. 压力单位：有序排列
    pressureUnits: ['MPa', 'bar', 'atm', 'psi', 'kPa', 'mmHg', 'Pa'],
    pressureFactors: {
      'MPa': 1,
      'bar': 10,
      'atm': 9.86923,
      'psi': 145.038,
      'kPa': 1000,
      'mmHg': 7500.62,
      'Pa': 1000000
    },
    pressureResults: {},
    activePressureUnit: '',

    // 2. 温度单位
    temperatureUnits: ['℃', '℉', 'K'],
    tempInputValue: '',
    tempOutputValue: '',
    tempInputUnitIndex: 0,
    tempOutputUnitIndex: 1,

    // 3. CEMS 换算
    gasTypes: ['SO₂', 'NOₓ', 'NO'],
    gasIndex: 0,
    molarMass: '64.06',
    molarMasses: { 'SO₂': 64.06, 'NOₓ': 46.01, 'NO': 30.01 },
    ppmValue: '',
    mgValue: ''
  },

  onLoad() {
    this.initPressureFields();
  },

  // 依然保留 onShow 逻辑，以便从历史页面跳转回来时能恢复查看（即便本页不再产生新记录）
  onShow() {
    const restoreData = wx.getStorageSync('restore_data');
    if (restoreData && (restoreData.type === 'unit_conversion' || restoreData.type === 'cems')) {
      this.setData(restoreData.rawData);
      wx.removeStorageSync('restore_data');
      wx.showToast({ title: '数据已恢复', icon: 'success' });
    }
  },

  initPressureFields() {
    let empty = {};
    this.data.pressureUnits.forEach(u => empty[u] = '');
    this.setData({ pressureResults: empty, activePressureUnit: '' });
  },

  // --- 压力换算逻辑 ---
  onPressureInput(e) {
    const unit = e.currentTarget.dataset.unit;
    const value = e.detail.value;

    if (value === '' || value === '.') {
      let results = this.data.pressureResults;
      results[unit] = value;
      this.setData({ pressureResults: results, activePressureUnit: unit });
      return;
    }

    try {
      const factors = this.data.pressureFactors;
      const inputVal = new Decimal(parseFloat(value));
      const baseMPa = inputVal.dividedBy(factors[unit]);
      
      let results = {};
      this.data.pressureUnits.forEach(u => {
        if (u === unit) {
          results[u] = value;
        } else {
          let res = baseMPa.times(factors[u]);
          let numRes = res.toNumber();
          if (numRes > 0 && numRes < 0.0001) {
            results[u] = numRes.toExponential(4);
          } else {
            results[u] = parseFloat(numRes.toFixed(6)).toString();
          }
        }
      });

      this.setData({
        pressureResults: results,
        activePressureUnit: unit
      });
    } catch (err) {
      console.error(err);
    }
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  switchUnitType(e) {
    this.setData({ unitType: e.currentTarget.dataset.type });
  },

  // --- 温度逻辑 ---
  onTempInput(e) {
    this.setData({ tempInputValue: e.detail.value });
    this.calculateTemp();
  },

  onTempUnitChange(e) {
    const isInput = e.currentTarget.dataset.type === 'input';
    if (isInput) this.setData({ tempInputUnitIndex: e.detail.value });
    else this.setData({ tempOutputUnitIndex: e.detail.value });
    this.calculateTemp();
  },

  calculateTemp() {
    const { tempInputValue, tempInputUnitIndex, tempOutputUnitIndex, temperatureUnits } = this.data;
    if (!tempInputValue) { this.setData({ tempOutputValue: '' }); return; }
    
    let val = parseFloat(tempInputValue);
    let from = temperatureUnits[tempInputUnitIndex];
    let to = temperatureUnits[tempOutputUnitIndex];
    let celsius;

    if (from === '℃') celsius = val;
    else if (from === '℉') celsius = (val - 32) * 5 / 9;
    else celsius = val - 273.15;

    let res;
    if (to === '℃') res = celsius;
    else if (to === '℉') res = celsius * 9 / 5 + 32;
    else res = celsius + 273.15;

    this.setData({ tempOutputValue: res.toFixed(2) });
  },

  // --- CEMS 逻辑 ---
  onGasChange(e) {
    const idx = e.detail.value;
    const gas = this.data.gasTypes[idx];
    this.setData({ gasIndex: idx, molarMass: this.data.molarMasses[gas] });
    this.calculateCEMS(this.data.ppmValue, 'ppm');
  },

  onPpmInput(e) { this.calculateCEMS(e.detail.value, 'ppm'); },
  onMgInput(e) { this.calculateCEMS(e.detail.value, 'mg'); },

  calculateCEMS(val, type) {
    if (!val) { this.setData({ ppmValue: '', mgValue: '' }); return; }
    const M = parseFloat(this.data.molarMass);
    if (type === 'ppm') {
      const mg = parseFloat(val) * M / 22.4;
      this.setData({ ppmValue: val, mgValue: mg.toFixed(2) });
    } else {
      const ppm = parseFloat(val) * 22.4 / M;
      this.setData({ mgValue: val, ppmValue: ppm.toFixed(2) });
    }
  },

  // --- 必要修改：将保存逻辑替换为清空逻辑 ---
  clearFields() {
    const { activeTab, unitType } = this.data;
    
    if (activeTab === 'unit') {
      if (unitType === 'pressure') {
        this.initPressureFields();
      } else {
        this.setData({ tempInputValue: '', tempOutputValue: '' });
      }
    } else {
      this.setData({ ppmValue: '', mgValue: '' });
    }
    
    wx.showToast({ title: '已清空', icon: 'none' });
  }
});