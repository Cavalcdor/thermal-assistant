// pages/thermal/thermal.js
const thermal = require('../../utils/thermal.js');
const Decimal = require('../../utils/decimal.js');
const app = getApp();

Page({
  data: {
    sensorType: 'thermocouple',
    selectedTypeIndex: 0,
    typeOptions: [],
    // --- 修改 1: 添加新的热电偶型号 ---
    thermocoupleTypes: ['K型', 'E型', 'S型', 'B型', 'R型', 'J型', 'N型', 'T型'],
    rtdTypes: ['Pt100', 'Pt1000', 'Cu50'],
    temperature: '',
    signal: '',
    coldJunction: '0',
    tempError: '',
    signalError: '',
    signalLabel: '电压',
    signalUnit: 'mV',
    signalPlaceholder: '输入电压或由温度自动计算', 
    rangeHint: '',
    lastInputSource: ''
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    const restoreData = wx.getStorageSync('restore_data');
    
    if (restoreData && restoreData.type === 'thermal') {
      this.setData(restoreData.rawData);
      
      const typeOptions = this.data.sensorType === 'thermocouple' ? 
                          this.data.thermocoupleTypes : 
                          this.data.rtdTypes;
      
      this.setData({
        typeOptions,
        signalLabel: this.data.sensorType === 'thermocouple' ? '电压' : '电阻',
        signalUnit: this.data.sensorType === 'thermocouple' ? 'mV' : 'Ω',
        signalPlaceholder: this.data.sensorType === 'thermocouple' ? '输入电压或由温度自动计算' : '输入电阻或由温度自动计算'
      });
      
      this.updateRangeHint();

      wx.removeStorageSync('restore_data');
      wx.showToast({
        title: '数据已恢复',
        icon: 'success'
      });
    }
  },

  saveRecord() {
    const {
      temperature,
      signal,
      sensorType,
      typeOptions,
      selectedTypeIndex,
      coldJunction,
      signalUnit,
      signalLabel
    } = this.data;

    if (!temperature && !signal) {
      wx.showToast({
        title: '请先进行计算',
        icon: 'none'
      });
      return;
    }

    const subType = typeOptions[selectedTypeIndex];
    const record = {
      type: 'thermal',
      time: new Date().getTime(),
      title: `${subType} 温度转换`,
      subTitle: `${temperature || '--'}℃ ⇄ ${signal || '--'}${signalUnit}`,
      desc: sensorType === 'thermocouple' ? `冷端补偿: ${coldJunction}℃` : '热电阻模式',
      details: [
        { label: '传感器类型', value: sensorType === 'thermocouple' ? '热电偶' : '热电阻' },
        { label: '规格型号', value: subType },
        { label: '测量温度', value: `${temperature || '--'} ℃` },
        { label: '输出信号', value: `${signal || '--'} ${signalUnit}` }
      ],
      rawData: {
        sensorType,
        selectedTypeIndex,
        temperature,
        signal,
        coldJunction,
        signalLabel,
        signalUnit
      }
    };

    if (sensorType === 'thermocouple') {
      record.details.push({ label: '冷端补偿', value: `${coldJunction} ℃` });
    }

    app.addHistory(record);
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
  },

  initPage() {
    const typeOptions = this.data.sensorType === 'thermocouple' ? this.data.thermocoupleTypes : this.data.rtdTypes;
    this.setData({
      typeOptions,
      selectedTypeIndex: 0
    });
    this.updateRangeHint();
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type;
    if (type === this.data.sensorType) return;
    const typeOptions = type === 'thermocouple' ? this.data.thermocoupleTypes : this.data.rtdTypes;
    const signalLabel = type === 'thermocouple' ? '电压' : '电阻';
    const signalUnit = type === 'thermocouple' ? 'mV' : 'Ω';
    const signalPlaceholder = type === 'thermocouple' ? '输入电压或由温度自动计算' : '输入电阻或由温度自动计算';
    
    this.setData({
      sensorType: type,
      typeOptions,
      selectedTypeIndex: 0,
      temperature: '',
      signal: '',
      coldJunction: '0',
      tempError: '',
      signalError: '',
      signalLabel,
      signalUnit,
      signalPlaceholder,
      lastInputSource: ''
    });
    this.updateRangeHint();
  },

  onTypeChange(e) {
    this.setData({
      selectedTypeIndex: parseInt(e.detail.value),
      temperature: '',
      signal: '',
      tempError: '',
      signalError: ''
    });
    this.updateRangeHint();
  },

  updateRangeHint() {
    const { sensorType, selectedTypeIndex } = this.data;
    let hint = '';
    if (sensorType === 'thermocouple') {
      // --- 修改 2: 添加新的量程提示 ---
      const ranges = {
        'K型': '范围: -270~1372℃',
        'E型': '范围: -270~1000℃',
        'S型': '范围: -50~1768.1℃',
        'B型': '范围: 0~1820℃',
        'R型': '范围: -50~1768.1℃',
        'J型': '范围: -210~1200℃',
        'N型': '范围: -270~1300℃',
        'T型': '范围: -270~400℃'
      };
      hint = ranges[this.data.thermocoupleTypes[selectedTypeIndex]] || '';
    } else {
      const ranges = {
        'Pt100': '范围: -200~850℃',
        'Pt1000': '范围: -200~850℃',
        'Cu50': '范围: -50~150℃'
      };
      hint = ranges[this.data.rtdTypes[selectedTypeIndex]] || '';
    }
    this.setData({ rangeHint: hint });
  },

  onTempInput(e) {
    this.setData({ temperature: e.detail.value, lastInputSource: 'temp', tempError: '' });
  },

  onTempFocus() {
    this.setData({ lastInputSource: 'temp' });
  },

  onTempBlur(e) {
    if (this.data.lastInputSource !== 'temp') return;
    const value = e.detail.value;
    if (!value) {
      this.setData({ signal: '', tempError: '', signalError: '' });
      return;
    }
    this.calculateSignalFromTemp(parseFloat(value));
  },

  onSignalInput(e) {
    this.setData({ signal: e.detail.value, lastInputSource: 'signal', signalError: '' });
  },

  onSignalFocus() {
    this.setData({ lastInputSource: 'signal' });
  },

  onSignalBlur(e) {
    if (this.data.lastInputSource !== 'signal') return;
    const value = e.detail.value;
    if (!value) {
      this.setData({ temperature: '', tempError: '', signalError: '' });
      return;
    }
    this.calculateTempFromSignal(parseFloat(value));
  },

  onColdJunctionChange(e) {
    const value = e.detail.value || '0';
    this.setData({ coldJunction: value });
    if (this.data.temperature) {
      this.calculateSignalFromTemp(parseFloat(this.data.temperature));
    } else if (this.data.signal) {
      this.calculateTempFromSignal(parseFloat(this.data.signal));
    }
  },

  calculateSignalFromTemp(temp) {
    try {
      const { sensorType, selectedTypeIndex, coldJunction } = this.data;
      const coldJunctionValue = parseFloat(coldJunction) || 0;
      let result;
      let decimals = 3;
      
      if (sensorType === 'thermocouple') {
        const currentType = this.data.thermocoupleTypes[selectedTypeIndex];
        let tc;
        // --- 修改 3: 在switch中添加新的case ---
        switch (currentType) {
          case 'K型': tc = thermal.KTypeThermocouple; break;
          case 'E型': tc = thermal.ETypeThermocouple; break;
          case 'S型': tc = thermal.STypeThermocouple; break;
          case 'B型': tc = thermal.BTypeThermocouple; break;
          case 'R型': tc = thermal.RTypeThermocouple; break;
          case 'J型': tc = thermal.JTypeThermocouple; break;
          case 'N型': tc = thermal.NTypeThermocouple; break;
          case 'T型': tc = thermal.TTypeThermocouple; break;
        }
        if (!tc.isInRange(temp, 'temp')) throw new Error('温度超出范围');
        result = tc.tempToVoltage(temp, coldJunctionValue);
        decimals = app.globalData.settings.thermocoupleDecimals || 3;
      } else {
        const currentType = this.data.rtdTypes[selectedTypeIndex];
        let rtd;
        switch (currentType) {
          case 'Pt100': rtd = thermal.Pt100RTD; break;
          case 'Pt1000': rtd = thermal.Pt1000RTD; break;
          case 'Cu50': rtd = thermal.Cu50RTD; break;
        }
        if (!rtd.isInRange(temp, 'temp')) throw new Error('温度超出范围');
        result = rtd.tempToResistance(temp);
        decimals = app.globalData.settings.rtdDecimals || 2;
      }
      this.setData({ signal: result.toFixed(decimals), tempError: '', signalError: '' });
    } catch (error) {
      this.setData({ tempError: error.message, signal: '' });
      if (app.globalData.settings.vibrationEnabled !== false) wx.vibrateShort();
    }
  },

  calculateTempFromSignal(signalValue) {
    try {
      const { sensorType, selectedTypeIndex, coldJunction } = this.data;
      const coldJunctionValue = parseFloat(coldJunction) || 0;
      let result;
      if (sensorType === 'thermocouple') {
        const currentType = this.data.thermocoupleTypes[selectedTypeIndex];
        let tc;
        // --- 修改 3: 在switch中添加新的case ---
        switch (currentType) {
          case 'K型': tc = thermal.KTypeThermocouple; break;
          case 'E型': tc = thermal.ETypeThermocouple; break;
          case 'S型': tc = thermal.STypeThermocouple; break;
          case 'B型': tc = thermal.BTypeThermocouple; break;
          case 'R型': tc = thermal.RTypeThermocouple; break;
          case 'J型': tc = thermal.JTypeThermocouple; break;
          case 'N型': tc = thermal.NTypeThermocouple; break;
          case 'T型': tc = thermal.TTypeThermocouple; break;
        }
        if (!tc.isInRange(signalValue, 'voltage')) throw new Error('电压超出范围');
        result = tc.voltageToTemp(signalValue, coldJunctionValue);
      } else {
        const currentType = this.data.rtdTypes[selectedTypeIndex];
        let rtd;
        switch (currentType) {
          case 'Pt100': rtd = thermal.Pt100RTD; break;
          case 'Pt1000': rtd = thermal.Pt1000RTD; break;
          case 'Cu50': rtd = thermal.Cu50RTD; break;
        }
        if (!rtd.isInRange(signalValue, 'resistance')) throw new Error('电阻超出范围');
        result = rtd.resistanceToTemp(signalValue);
      }
      this.setData({ temperature: result.toFixed(2), tempError: '', signalError: '' });
    } catch (error) {
      this.setData({ signalError: error.message, temperature: '' });
      if (app.globalData.settings.vibrationEnabled !== false) wx.vibrateShort();
    }
  },

  clearTemp() {
    this.setData({ temperature: '', signal: '', tempError: '', signalError: '' });
  },

  clearSignal() {
    this.setData({ temperature: '', signal: '', tempError: '', signalError: '' });
  },

  clearAll() {
    this.setData({ temperature: '', signal: '', coldJunction: '0', tempError: '', signalError: '' });
  }
});