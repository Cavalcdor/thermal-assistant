// utils/decimal.js
// 高精度数值计算工具

class Decimal {
  constructor(value) {
    this.value = parseFloat(value) || 0;
  }

  // 加法
  plus(other) {
    const otherValue = other instanceof Decimal ? other.value : parseFloat(other);
    // 避免浮点数精度问题
    const result = this._precisionAdd(this.value, otherValue);
    return new Decimal(result);
  }

  // 减法
  minus(other) {
    const otherValue = other instanceof Decimal ? other.value : parseFloat(other);
    const result = this._precisionAdd(this.value, -otherValue);
    return new Decimal(result);
  }

  // 乘法
  times(other) {
    const otherValue = other instanceof Decimal ? other.value : parseFloat(other);
    const result = this._precisionMultiply(this.value, otherValue);
    return new Decimal(result);
  }

  // 除法
  dividedBy(other) {
    const otherValue = other instanceof Decimal ? other.value : parseFloat(other);
    if (otherValue === 0) {
      throw new Error('除数不能为0');
    }
    const result = this._precisionDivide(this.value, otherValue);
    return new Decimal(result);
  }

  // 绝对值
  abs() {
    return new Decimal(Math.abs(this.value));
  }

  // 四舍五入
  toFixed(decimals) {
    return this.value.toFixed(decimals);
  }

  // 转换为数字
  toNumber() {
    return this.value;
  }

  // 转换为字符串
  toString() {
    return this.value.toString();
  }

  // 高精度加法
  _precisionAdd(a, b) {
    const decimalsA = this._getDecimals(a);
    const decimalsB = this._getDecimals(b);
    const maxDecimals = Math.max(decimalsA, decimalsB);
    const multiplier = Math.pow(10, maxDecimals);
    
    return (Math.round(a * multiplier) + Math.round(b * multiplier)) / multiplier;
  }

  // 高精度乘法
  _precisionMultiply(a, b) {
    const decimalsA = this._getDecimals(a);
    const decimalsB = this._getDecimals(b);
    const multiplier = Math.pow(10, decimalsA + decimalsB);
    
    const intA = Math.round(a * Math.pow(10, decimalsA));
    const intB = Math.round(b * Math.pow(10, decimalsB));
    
    return (intA * intB) / multiplier;
  }

  // 高精度除法
  _precisionDivide(a, b) {
    const decimalsA = this._getDecimals(a);
    const decimalsB = this._getDecimals(b);
    const maxDecimals = Math.max(decimalsA, decimalsB) + 6; // 额外精度
    const multiplier = Math.pow(10, maxDecimals);
    
    const intA = Math.round(a * multiplier);
    const intB = Math.round(b * Math.pow(10, decimalsB));
    
    return intA / intB / Math.pow(10, maxDecimals - decimalsB);
  }

  // 获取小数位数
  _getDecimals(num) {
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    if (decimalIndex === -1) return 0;
    return str.length - decimalIndex - 1;
  }

  isZero() {
    return this.value === 0;
  }
  
  isNegative() {
    return this.value < 0;
  }
}

// 静态方法
Decimal.add = function(a, b) {
  return new Decimal(a).plus(b);
};

Decimal.subtract = function(a, b) {
  return new Decimal(a).minus(b);
};

Decimal.multiply = function(a, b) {
  return new Decimal(a).times(b);
};

Decimal.divide = function(a, b) {
  return new Decimal(a).dividedBy(b);
};

module.exports = Decimal;
