// utils/thermal.js
// 热工转换算法库 - 基于 ITS-90 国际温标

/** 
 * B 型热电偶算法
 */
const BTypeThermocouple = {
  // 温度范围: 0°C to 1820°C
  
  // 温度转电压系数 E = sum(c_i * t^i)
  tempToVoltageCoefficients: {
    // 0°C to 630.615°C
    range1: {
      min: 0,
      max: 630.615,
      c: [
        0.000000000000E+00,
       -0.246508183460E-03,
        0.590404211710E-05,
       -0.132579316360E-08,
        0.156682919010E-11,
       -0.169445292400E-14,
        0.629903470940E-18
      ]
    },
    // 630.615°C to 1820°C
    range2: {
      min: 630.615,
      max: 1820,
      c: [
       -0.389381686210E+01,
        0.285717474700E-01,
       -0.848851047850E-04,
        0.157852801640E-06,
       -0.168353448640E-09,
        0.111097940130E-12,
       -0.445154310330E-16,
        0.989756408210E-20,
       -0.937913302890E-24
      ]
    }
  },

  // 电压转温度系数 t = sum(d_i * E^i)
  voltageToTempCoefficients: {
    // 0.291mV to 2.431mV (250°C to 700°C)
    range1: {
      min: 0.291,
      max: 2.431,
      c: [
        9.8423321E+01,
        6.9971500E+02,
       -8.4765304E+02,
        1.0052644E+03,
       -8.3345952E+02,
        4.5508542E+02,
       -1.5523037E+02,
        2.9886750E+01,
       -2.4742860E+00
      ]
    },
    // 2.431mV to 13.820mV (700°C to 1820°C)
    range2: {
      min: 2.431,
      max: 13.820,
      c: [
        2.1315071E+02,
        2.8510504E+02,
       -5.2742887E+01,
        9.9160804E+00,
       -1.2965303E+00,
        1.1195870E-01,
       -6.0625199E-03,
        1.8661696E-04,
       -2.4878585E-06
      ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
      const coeffs = this.tempToVoltageCoefficients;
      if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
        const c = coeffs.range2.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
        const c = coeffs.range1.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else {
        throw new Error('温度超出有效范围');
      }
    };

    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
    
    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range2.min && totalVoltage <= coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      // B-Type is not recommended for low temperatures, inverse function starts at 250C.
      throw new Error('电压超出有效范围 (0.291mV to 13.820mV)');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= 0 && value <= 1820;
    } else {
      // Note: Inverse function accuracy is specified for 0.291mV and up.
      return value >= 0 && value <= 13.820;
    }
  }
};

/**
 * E 型热电偶算法
 * 参考标准: ITS-90

 */
const ETypeThermocouple = {
  // 温度范围: -270°C to 1000°C
  
  tempToVoltageCoefficients: {
    // -270°C to 0°C
    range1: {
      min: -270,
      max: 0,
      c: [
        0.000000000000E+00,  0.586655087080E-01,  0.454109771240E-04,
       -0.779980486860E-06, -0.258001608430E-07, -0.594525830570E-09,
       -0.932140586670E-11, -0.102876055340E-12, -0.803701236210E-15,
       -0.439794973910E-17, -0.164147763550E-19, -0.396736195160E-22,
       -0.558273287210E-25, -0.346578420130E-28
      ]
    },
    // 0°C to 1000°C
    range2: {
      min: 0,
      max: 1000,
      c: [
        0.000000000000E+00,  0.586655087100E-01,  0.450322755820E-04,
        0.289084072120E-07, -0.330568966520E-09,  0.650244032700E-12,
       -0.191974955040E-15, -0.125366004970E-17,  0.214892175690E-20,
       -0.143880417820E-23,  0.359608994810E-27
      ]
    }
  },

  voltageToTempCoefficients: {
    // -8.825mV to 0mV (-200°C to 0°C)
    range1: {
      min: -8.825,
      max: 0,
      c: [
         0.0000000E+00,  1.6977288E+01, -4.3514970E-01,
        -1.5859697E-01, -9.2502871E-02, -2.6084314E-02,
        -4.1360199E-03, -3.4034030E-04, -1.1564890E-05
      ]
    },
    // 0mV to 76.373mV (0°C to 1000°C)
    range2: {
      min: 0,
      max: 76.373,
      c: [
        0.0000000E+00,  1.7057035E+01, -2.3301759E-01,
        6.5435585E-03, -7.3562749E-05, -1.7896001E-06,
        8.4036165E-08, -1.3735879E-09,  1.0629823E-11,
       -3.2447087E-14
      ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
      const coeffs = this.tempToVoltageCoefficients;
      if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
        const c = coeffs.range2.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
        const c = coeffs.range1.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else {
        throw new Error('温度超出有效范围');
      }
    };
    
    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
    
    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range2.min && totalVoltage <= coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      throw new Error('电压超出有效范围');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -270 && value <= 1000;
    } else {
      // Note: Inverse function accuracy is specified for -8.825mV and up.
      return value >= -9.835 && value <= 76.373; // Keeping wider range from original code for broader applicability
    }
  }
};

/**
 * J 型热电偶算法
 * 参考标准: ITS-90

 */
const JTypeThermocouple = {
  // 温度范围: -210°C to 1200°C
  
  tempToVoltageCoefficients: {
    // -210°C to 760°C
    range1: {
      min: -210,
      max: 760,
      c: [
        0.000000000000E+00,  0.503811878150E-01,  0.304758369300E-04,
       -0.856810657200E-07,  0.132281952950E-09, -0.170529583370E-12,
        0.209480906970E-15, -0.125383953360E-18,  0.156317256970E-22
      ]
    },
    // 760°C to 1200°C
    range2: {
      min: 760,
      max: 1200,
      c: [
        0.296456256810E+03, -0.149761277860E+01,  0.317871039240E-02,
       -0.318476867010E-05,  0.157208190040E-08, -0.306913690560E-12
      ]
    }
  },

  voltageToTempCoefficients: {
    // -8.095mV to 0mV (-210°C to 0°C)
    range1: {
      min: -8.095,
      max: 0,
      c: [
        0.0000000E+00,  1.9528268E+01, -1.2286185E+00,
       -1.0752178E+00, -5.9086933E-01, -1.7256713E-01,
       -2.8131513E-02, -2.3963370E-03, -8.3823321E-05
      ]
    },
    // 0mV to 42.919mV (0°C to 760°C)
    range2: {
      min: 0,
      max: 42.919,
      c: [
        0.000000E+00,  1.978425E+01, -2.001204E-01,
        1.036969E-02, -2.549687E-04,  3.585153E-06,
       -5.344285E-08,  5.099890E-10
      ]
    },
    // 42.919mV to 69.553mV (760°C to 1200°C)
    range3: {
      min: 42.919,
      max: 69.553,
      c: [
        -3.11358187E+03,  3.00543684E+02, -9.94773230E+00,
         1.70276630E-01, -1.43033468E-03,  4.73886084E-06
      ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
      const coeffs = this.tempToVoltageCoefficients;
      if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
        const c = coeffs.range2.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
        const c = coeffs.range1.c;
        let v = 0;
        for (let i = 0; i < c.length; i++) {
          v += c[i] * Math.pow(t, i);
        }
        return v;
      } else {
        throw new Error('温度超出有效范围');
      }
    };
    
    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
    
    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range3.min && totalVoltage <= coeffs.range3.max) {
      const c = coeffs.range3.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range2.min && totalVoltage < coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      throw new Error('电压超出有效范围');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -210 && value <= 1200;
    } else {
      return value >= -8.095 && value <= 69.553;
    }
  }
};

/**
 * K 型热电偶算法
 * 参考标准: ITS-90

 */
const KTypeThermocouple = {
  // 温度范围: -270°C to 1372°C
  
  tempToVoltageCoefficients: {
    // -270°C to 0°C
    range1: {
      min: -270,
      max: 0,
      c: [
        0.000000000000E+00,  0.394501280250E-01,  0.236223735980E-04,
       -0.328589067840E-06, -0.499048287770E-08, -0.675090591730E-10,
       -0.574103274280E-12, -0.310888728940E-14, -0.104516093650E-16,
       -0.198892668780E-19, -0.163226974860E-22
      ]
    },
    // 0°C to 1372°C
    range2: {
      min: 0,
      max: 1372,
      c: [
       -0.176004136860E-01,  0.389212049750E-01,  0.185587700320E-04,
       -0.994575928740E-07,  0.318409457190E-09, -0.560728448890E-12,
        0.560750590590E-15, -0.320207200030E-18,  0.971511471520E-22,
       -0.121047212750E-25
      ],
      // 指数修正项系数
      a: [0.118597600000E+00, -0.118343200000E-03,  0.126968600000E+03]
    }
  },

  voltageToTempCoefficients: {
    // -5.891mV to 0mV (-200°C to 0°C)
    range1: {
      min: -5.891,
      max: 0,
      c: [
        0.0000000E+00,  2.5173462E+01, -1.1662878E+00,
       -1.0833638E+00, -8.9773540E-01, -3.7342377E-01,
       -8.6632643E-02, -1.0450598E-02, -5.1920577E-04
      ]
    },
    // 0mV to 20.644mV (0°C to 500°C)
    range2: {
      min: 0,
      max: 20.644,
      c: [
         0.000000E+00,  2.508355E+01,  7.860106E-02,
        -2.503131E-01,  8.315270E-02, -1.228034E-02,
         9.804036E-04, -4.413030E-05,  1.057734E-06,
        -1.052755E-08
      ]
    },
    // 20.644mV to 54.886mV (500°C to 1372°C)
    range3: {
      min: 20.644,
      max: 54.886,
      c: [
       -1.318058E+02,  4.830222E+01, -1.646031E+00,
        5.464731E-02, -9.650715E-04,  8.802193E-06,
       -3.110810E-08
      ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
        const coeffs = this.tempToVoltageCoefficients;
        let v = 0;
        
        if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
            const c = coeffs.range2.c;
            const a = coeffs.range2.a;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
            v += a[0] * Math.exp(a[1] * Math.pow(t - a[2], 2));
        } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
            const c = coeffs.range1.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else {
            throw new Error('温度超出有效范围');
        }
        return v;
    };
    
    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;

    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range3.min && totalVoltage <= coeffs.range3.max) {
      const c = coeffs.range3.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range2.min && totalVoltage < coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      throw new Error('电压超出有效范围');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -270 && value <= 1372;
    } else {
      // Note: Inverse function accuracy is specified for -5.891mV and up
      return value >= -6.458 && value <= 54.886; // Keeping wider range
    }
  }
};

/**
 * N 型热电偶算法
 * 参考标准: ITS-90

 */
const NTypeThermocouple = {
    // 温度范围: -270°C to 1300°C

    tempToVoltageCoefficients: {
        // -270°C to 0°C
        range1: {
            min: -270,
            max: 0,
            c: [
                0.000000000000E+00, 0.261591059620E-01, 0.109574842280E-04,
               -0.938411115540E-07, -0.464120397590E-10, -0.263033577160E-11,
               -0.226534380030E-13, -0.760893007910E-16, -0.934196678350E-19
            ]
        },
        // 0°C to 1300°C
        range2: {
            min: 0,
            max: 1300,
            c: [
                0.000000000000E+00, 0.259293946010E-01, 0.157101418800E-04,
                0.438256272370E-07,-0.252611697940E-09, 0.643118193390E-12,
               -0.100634715190E-14, 0.997453389920E-18,-0.608632456070E-21,
                0.208492293390E-24,-0.306821961510E-28
            ]
        }
    },

    voltageToTempCoefficients: {
        // -3.990mV to 0mV (-200°C to 0°C)
        range1: {
            min: -3.990,
            max: 0,
            c: [
                0.0000000E+00, 3.8436847E+01, 1.1010485E+00,
                5.2229312E+00, 7.2060525E+00, 5.8488586E+00,
                2.7754916E+00, 7.7075166E-01, 1.1582665E-01,
                7.3138868E-03
            ]
        },
        // 0mV to 20.613mV (0°C to 600°C)
        range2: {
            min: 0,
            max: 20.613,
            c: [
                0.00000E+00,  3.86896E+01, -1.08267E+00,
                4.70205E-02, -2.12169E-06, -1.17272E-04,
                5.39280E-06, -7.98156E-08
            ]
        },
        // 20.613mV to 47.513mV (600°C to 1300°C)
        range3: {
            min: 20.613,
            max: 47.513,
            c: [
                1.972485E+01, 3.300943E+01, -3.915159E-01,
                9.855391E-03,-1.274371E-04,  7.767022E-07
            ]
        }
    },
    
    tempToVoltage(temp, coldJunction = 0) {
        const calculateVoltage = (t) => {
            const coeffs = this.tempToVoltageCoefficients;
            if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
                const c = coeffs.range2.c;
                let v = 0;
                for (let i = 0; i < c.length; i++) {
                    v += c[i] * Math.pow(t, i);
                }
                return v;
            } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
                const c = coeffs.range1.c;
                let v = 0;
                for (let i = 0; i < c.length; i++) {
                    v += c[i] * Math.pow(t, i);
                }
                return v;
            } else {
                throw new Error('温度超出有效范围');
            }
        };

        const voltage = calculateVoltage(temp);
        const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;

        return voltage - coldVoltage;
    },

    voltageToTemp(voltage, coldJunction = 0) {
        let totalVoltage = voltage;
        if (coldJunction !== 0) {
            totalVoltage += this.tempToVoltage(coldJunction, 0);
        }

        const coeffs = this.voltageToTempCoefficients;
        let temp = 0;

        if (totalVoltage >= coeffs.range3.min && totalVoltage <= coeffs.range3.max) {
            const c = coeffs.range3.c;
            for (let i = 0; i < c.length; i++) {
                temp += c[i] * Math.pow(totalVoltage, i);
            }
        } else if (totalVoltage >= coeffs.range2.min && totalVoltage < coeffs.range2.max) {
            const c = coeffs.range2.c;
            for (let i = 0; i < c.length; i++) {
                temp += c[i] * Math.pow(totalVoltage, i);
            }
        } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
            const c = coeffs.range1.c;
            for (let i = 0; i < c.length; i++) {
                temp += c[i] * Math.pow(totalVoltage, i);
            }
        } else {
            throw new Error('电压超出有效范围');
        }

        return temp;
    },

    isInRange(value, type) {
        if (type === 'temp') {
            return value >= -270 && value <= 1300;
        } else {
            return value >= -3.990 && value <= 47.513;
        }
    }
};

/**
 * R 型热电偶算法
 * 参考标准: ITS-90

 */
const RTypeThermocouple = {
  // 温度范围: -50°C to 1768.1°C
  
  tempToVoltageCoefficients: {
    // -50°C to 1064.18°C
    range1: {
      min: -50,
      max: 1064.18,
      c: [
        0.000000000000E+00,  0.528961729765E-02,  0.139166589782E-04,
       -0.238855693017E-07,  0.356916001063E-10, -0.462347666298E-13,
        0.500777441034E-16, -0.373105886191E-19,  0.157716482367E-22,
       -0.281038625251E-26
      ]
    },
    // 1064.18°C to 1664.5°C
    range2: {
      min: 1064.18,
      max: 1664.5,
      c: [
        0.295157925316E+01, -0.252061251332E-02,  0.159564501865E-04,
       -0.764085947576E-08,  0.205305291024E-11, -0.293359668173E-15
      ]
    },
    // 1664.5°C to 1768.1°C
    range3: {
        min: 1664.5,
        max: 1768.1,
        c: [
            0.152232118209E+03, -0.268819888545E+00, 0.171280280471E-03,
           -0.345895706453E-07, -0.934633971046E-14
        ]
    }
  },

  voltageToTempCoefficients: {
    // -0.226mV to 1.923mV (-50°C to 250°C)
    range1: {
      min: -0.226,
      max: 1.923,
      c: [
        0.0000000E+00, 1.8891380E+02,-9.3835290E+01,
        1.3068619E+02,-2.2703580E+02, 3.5145659E+02,
       -3.8953900E+02, 2.8239471E+02,-1.2607281E+02,
        3.1353611E+01,-3.3187769E+00
      ]
    },
    // 1.923mV to 11.361mV (250°C to 1064°C)
    range2: {
      min: 1.923,
      max: 11.361,
      c: [
        1.334584505E+01, 1.472644573E+02, -1.844024844E+01,
        4.031129726E+00, -6.249428360E-01,  6.468412046E-02,
       -4.458750426E-03,  1.994710149E-04, -5.313401790E-06,
        6.481976217E-08
      ]
    },
    // 11.361mV to 19.739mV (1064°C to 1664.5°C)
    range3: {
      min: 11.361,
      max: 19.739,
      c: [
        -8.199599416E+01, 1.553962042E+02, -8.342197663E+00,
         4.279433549E-01, -1.191577910E-02,  1.492290091E-04
      ]
    },
    // 19.739mV to 21.103mV (1664.5°C to 1768.1°C)
    range4: {
        min: 19.739,
        max: 21.103,
        c: [
             3.406177836E+04, -7.023729171E+03, 5.582903813E+02,
            -1.952394635E+01,  2.560740231E-01
        ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
        const coeffs = this.tempToVoltageCoefficients;
        let v = 0;
        if (t >= coeffs.range3.min && t <= coeffs.range3.max) {
            const c = coeffs.range3.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else if (t >= coeffs.range2.min && t < coeffs.range2.max) {
            const c = coeffs.range2.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
            const c = coeffs.range1.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else {
            throw new Error('温度超出有效范围');
        }
        return v;
    };

    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
    
    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range4.min && totalVoltage <= coeffs.range4.max) {
      const c = coeffs.range4.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range3.min && totalVoltage < coeffs.range3.max) {
      const c = coeffs.range3.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range2.min && totalVoltage < coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      throw new Error('电压超出有效范围');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -50 && value <= 1768.1;
    } else {
      return value >= -0.226 && value <= 21.103;
    }
  }
};

/**
 * S 型热电偶算法
 * 参考标准: ITS-90

 */
const STypeThermocouple = {
  // 温度范围: -50°C to 1768.1°C
  
  tempToVoltageCoefficients: {
    // -50°C to 1064.18°C
    range1: {
      min: -50,
      max: 1064.18,
      c: [
        0.000000000000E+00,  0.540313308631E-02,  0.125934289740E-04,
       -0.232477968689E-07,  0.322028823036E-10, -0.331465196389E-13,
        0.255744251786E-16, -0.125068871393E-19,  0.271443176145E-23
      ]
    },
    // 1064.18°C to 1664.5°C
    range2: {
      min: 1064.18,
      max: 1664.5,
      c: [
        0.132900444085E+01, 0.334509311344E-02, 0.654805192818E-05,
       -0.164856259209E-08, 0.129989605174E-13
      ]
    },
    // 1664.5°C to 1768.1°C
    range3: {
        min: 1664.5,
        max: 1768.1,
        c: [
            0.146628232636E+03,-0.258430516752E+00, 0.163693574641E-03,
           -0.330439046987E-07,-0.943223690612E-14
        ]
    }
  },

  voltageToTempCoefficients: {
    // -0.235mV to 1.874mV (-50°C to 250°C)
    range1: {
      min: -0.235,
      max: 1.874,
      c: [
        0.00000000E+00, 1.84949460E+02,-8.00504062E+01,
        1.02237430E+02,-1.52248592E+02, 1.88821343E+02,
       -1.59085941E+02, 8.23027880E+01,-2.34181944E+01,
        2.79786260E+00
      ]
    },
    // 1.874mV to 10.332mV (250°C to 1064°C)
    range2: {
      min: 1.874,
      max: 10.332, // End of range 2 from text is 11.950mV (1200C), using 10.332mV (1064C) as boundary
      c: [
        1.291507177E+01, 1.466298863E+02,-1.534713402E+01,
        3.145945973E+00,-4.163257839E-01, 3.187963771E-02,
       -1.291637500E-03, 2.183475087E-05,-1.447379511E-07,
        8.211272125E-09
      ]
    },
    // 10.332mV to 17.536mV (1064°C to 1664.5°C)
    range3: {
      min: 10.332,
      max: 17.536,
      c: [
        -8.087801117E+01, 1.621573104E+02, -8.536869453E+00,
         4.719686976E-01, -1.441693666E-02,  2.081618890E-04
      ]
    },
    // 17.536mV to 18.693mV (1664.5°C to 1768.1°C)
    range4: {
        min: 17.536,
        max: 18.693,
        c: [
             5.333875126E+04, -1.235892298E+04,  1.092657613E+03,
            -4.265693686E+01,   6.247205420E-01
        ]
    }
  },

  tempToVoltage(temp, coldJunction = 0) {
    const calculateVoltage = (t) => {
        const coeffs = this.tempToVoltageCoefficients;
        let v = 0;
        if (t >= coeffs.range3.min && t <= coeffs.range3.max) {
            const c = coeffs.range3.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else if (t >= coeffs.range2.min && t < coeffs.range2.max) {
            const c = coeffs.range2.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
            const c = coeffs.range1.c;
            for (let i = 0; i < c.length; i++) {
                v += c[i] * Math.pow(t, i);
            }
        } else {
            throw new Error('温度超出有效范围');
        }
        return v;
    };
    
    const voltage = calculateVoltage(temp);
    const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
    
    return voltage - coldVoltage;
  },

  voltageToTemp(voltage, coldJunction = 0) {
    let totalVoltage = voltage;
    if (coldJunction !== 0) {
      totalVoltage += this.tempToVoltage(coldJunction, 0);
    }

    const coeffs = this.voltageToTempCoefficients;
    let temp = 0;

    if (totalVoltage >= coeffs.range4.min && totalVoltage <= coeffs.range4.max) {
      const c = coeffs.range4.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range3.min && totalVoltage < coeffs.range3.max) {
      const c = coeffs.range3.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range2.min && totalVoltage < coeffs.range2.max) {
      const c = coeffs.range2.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
      const c = coeffs.range1.c;
      for (let i = 0; i < c.length; i++) {
        temp += c[i] * Math.pow(totalVoltage, i);
      }
    } else {
      throw new Error('电压超出有效范围');
    }

    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -50 && value <= 1768.1;
    } else {
      return value >= -0.235 && value <= 18.693;
    }
  }
};

/**
 * T 型热电偶算法
 * 参考标准: ITS-90

 */
const TTypeThermocouple = {
    // 温度范围: -270°C to 400°C

    tempToVoltageCoefficients: {
        // -270°C to 0°C
        range1: {
            min: -270,
            max: 0,
            c: [
                0.000000000000E+00, 0.387481063640E-01, 0.441944343470E-04,
                0.118443231050E-06, 0.200329735540E-07, 0.901380195590E-09,
                0.226511565930E-10, 0.360711542050E-12, 0.384939398830E-14,
                0.282135219250E-16, 0.142515947790E-18, 0.487686622860E-21,
                0.107955392700E-23, 0.139450270620E-26, 0.797951539270E-30
            ]
        },
        // 0°C to 400°C
        range2: {
            min: 0,
            max: 400,
            c: [
                0.000000000000E+00, 0.387481063640E-01, 0.332922278800E-04,
                0.206182434040E-06,-0.218822568460E-08, 0.109968809280E-10,
               -0.308157587720E-13, 0.454791352900E-16,-0.275129016730E-19
            ]
        }
    },

    voltageToTempCoefficients: {
        // -5.603mV to 0mV (-200°C to 0°C)
        range1: {
            min: -5.603,
            max: 0,
            c: [
                0.0000000E+00, 2.5949192E+01, -2.1316967E-01,
                7.9018692E-01, 4.2527777E-01, 1.3304473E-01,
                2.0241446E-02, 1.2668171E-03
            ]
        },
        // 0mV to 20.872mV (0°C to 400°C)
        range2: {
            min: 0,
            max: 20.872,
            c: [
                0.000000E+00, 2.592800E+01, -7.602961E-01,
                4.637791E-02,-2.165394E-03,  6.048144E-05,
               -7.293422E-07
            ]
        }
    },

    tempToVoltage(temp, coldJunction = 0) {
        const calculateVoltage = (t) => {
            const coeffs = this.tempToVoltageCoefficients;
            if (t >= coeffs.range2.min && t <= coeffs.range2.max) {
                const c = coeffs.range2.c;
                let v = 0;
                for (let i = 0; i < c.length; i++) {
                    v += c[i] * Math.pow(t, i);
                }
                return v;
            } else if (t >= coeffs.range1.min && t < coeffs.range1.max) {
                const c = coeffs.range1.c;
                let v = 0;
                for (let i = 0; i < c.length; i++) {
                    v += c[i] * Math.pow(t, i);
                }
                return v;
            } else {
                throw new Error('温度超出有效范围');
            }
        };

        const voltage = calculateVoltage(temp);
        const coldVoltage = (coldJunction !== 0) ? calculateVoltage(coldJunction) : 0;
        
        return voltage - coldVoltage;
    },

    voltageToTemp(voltage, coldJunction = 0) {
        let totalVoltage = voltage;
        if (coldJunction !== 0) {
            totalVoltage += this.tempToVoltage(coldJunction, 0);
        }

        const coeffs = this.voltageToTempCoefficients;
        let temp = 0;

        if (totalVoltage >= coeffs.range2.min && totalVoltage <= coeffs.range2.max) {
            const c = coeffs.range2.c;
            for (let i = 0; i < c.length; i++) {
                temp += c[i] * Math.pow(totalVoltage, i);
            }
        } else if (totalVoltage >= coeffs.range1.min && totalVoltage < coeffs.range1.max) {
            const c = coeffs.range1.c;
            for (let i = 0; i < c.length; i++) {
                temp += c[i] * Math.pow(totalVoltage, i);
            }
        } else {
            throw new Error('电压超出有效范围');
        }

        return temp;
    },

    isInRange(value, type) {
        if (type === 'temp') {
            return value >= -270 && value <= 400;
        } else {
            return value >= -6.188 && value <= 20.872; // Voltage for -250C is -6.188mV
        }
    }
};

/**
 * Pt100 热电阻算法 (高精度)
 * 参考标准: IEC 60751
 */
const Pt100RTD = {
  // 温度范围: -200°C to 850°C
  
  R0: 100.0,
  A: 3.9083E-3,
  B: -5.775E-7,
  C: -4.183E-12,

  tempToResistance(temp) {
    const R0 = this.R0;
    const A = this.A;
    const B = this.B;
    const C = this.C;
    let resistance;

    if (temp >= 0 && temp <= 850) {
      resistance = R0 * (1 + A * temp + B * temp * temp);
    } else if (temp >= -200 && temp < 0) {
      resistance = R0 * (1 + A * temp + B * temp * temp + C * (temp - 100) * temp * temp * temp);
    } else {
      throw new Error('温度超出有效范围');
    }

    return resistance;
  },

  resistanceToTemp(resistance) {
    const R0 = this.R0;
    const A = this.A;
    const B = this.B;

    if (resistance < 18.52 || resistance > 390.48) {
      throw new Error('电阻超出有效范围');
    }

    if (resistance >= R0) {
      // 0°C - 850°C
      const c_val = 1 - (resistance / R0);
      const discriminant = A * A - 4 * B * c_val;
      return (-A + Math.sqrt(discriminant)) / (2 * B);
    } else {
      // -200°C - 0°C
      let temp = (resistance - R0) / (R0 * A);
      const C = this.C;
      
      for (let i = 0; i < 20; i++) {
        const t2 = temp * temp;
        const t3 = t2 * temp;
        // R(t)
        const calculatedR = R0 * (1 + A * temp + B * t2 + C * (temp - 100) * t3);
        const error = calculatedR - resistance;
        
        if (Math.abs(error) < 1e-9) break;
        
        // R'(t) 导数
        const derivative = R0 * (A + 2 * B * temp + C * (4 * t3 - 300 * t2));
        
        temp -= error / derivative;
      }
      return temp;
    }
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -200 && value <= 850;
    } else {
      return value >= 18.52 && value <= 390.48;
    }
  }
};

/**
 * Pt1000 热电阻算法
 * 参考标准: IEC 60751
 */
const Pt1000RTD = {
  // 温度范围: -200°C to 850°C
  
  R0: 1000.0,
  A: 3.9083E-3,
  B: -5.775E-7,
  C: -4.183E-12,

  tempToResistance(temp) {
    const R0 = this.R0;
    const A = this.A;
    const B = this.B;
    const C = this.C;
    let resistance;

    if (temp >= 0 && temp <= 850) {
      resistance = R0 * (1 + A * temp + B * temp * temp);
    } else if (temp >= -200 && temp < 0) {
      resistance = R0 * (1 + A * temp + B * temp * temp + C * (temp - 100) * temp * temp * temp);
    } else {
      throw new Error('温度超出有效范围');
    }

    return resistance;
  },

  resistanceToTemp(resistance) {
    const R0 = this.R0;
    const A = this.A;
    const B = this.B;

    if (resistance < 185.2 || resistance > 3904.8) {
      throw new Error('电阻超出有效范围');
    }

    if (resistance >= R0) {
      // 0°C - 850°C: 解析解
      const c_val = 1 - (resistance / R0);
      const discriminant = A * A - 4 * B * c_val;
      return (-A + Math.sqrt(discriminant)) / (2 * B);
    } else {
      // -200°C - 0°C: 高精度迭代
      let temp = (resistance - R0) / (R0 * A);
      const C = this.C;
      
      for (let i = 0; i < 20; i++) {
        const t2 = temp * temp;
        const t3 = t2 * temp;
        const calculatedR = R0 * (1 + A * temp + B * t2 + C * (temp - 100) * t3);
        const error = calculatedR - resistance;
        
        if (Math.abs(error) < 1e-9) break;
        
        const derivative = R0 * (A + 2 * B * temp + C * (4 * t3 - 300 * t2));
        temp -= error / derivative;
      }
      return temp;
    }
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -200 && value <= 850;
    } else {
      return value >= 185.2 && value <= 3904.8;
    }
  }
};

/**
 * Cu50 铜电阻算法
 * 参考标准: GOST 6651-2009 / IEC 60751附录
 */
const Cu50RTD = {
  // 温度范围: -50°C to 150°C
  // 电阻范围: 39.24Ω to 82.13Ω
  
  R0: 50.0,
  A: 4.280E-3,
  B: -6.203E-7,
  C: 8.515E-12,

  tempToResistance(temp) {
    if (temp < -50 || temp > 150) {
      throw new Error('温度超出有效范围');
    }
    
    let resistance;
    if (temp >= 0) {
        resistance = this.R0 * (1 + this.A * temp + this.B * temp * temp);
    } else {
        resistance = this.R0 * (1 + this.A * temp + this.B * temp * temp + this.C * (temp - 100) * temp * temp);
    }
    return resistance;
  },

  resistanceToTemp(resistance) {
    if (resistance < 39.24 || resistance > 82.13) {
      throw new Error('电阻超出有效范围');
    }

    let temp = (resistance / this.R0 - 1) / this.A;
    
    for (let i = 0; i < 10; i++) {
       let calculatedR;
       let derivative;
       
       if (temp >= 0) {
           calculatedR = this.R0 * (1 + this.A * temp + this.B * temp * temp);
           derivative = this.R0 * (this.A + 2 * this.B * temp);
       } else {
           const t2 = temp * temp;
           calculatedR = this.R0 * (1 + this.A * temp + this.B * t2 + this.C * (temp - 100) * t2);
           derivative = this.R0 * (this.A + 2 * this.B * temp + this.C * (3 * t2 - 200 * temp));
       }
       
       const error = calculatedR - resistance;
       if (Math.abs(error) < 1e-9) break;
       
       temp -= error / derivative;
    }
    return temp;
  },

  isInRange(value, type) {
    if (type === 'temp') {
      return value >= -50 && value <= 150;
    } else {
      return value >= 39.24 && value <= 82.13;
    }
  }
};

// 导出模块
module.exports = {
  BTypeThermocouple,
  ETypeThermocouple,
  JTypeThermocouple,
  KTypeThermocouple,
  NTypeThermocouple,
  RTypeThermocouple,
  STypeThermocouple,
  TTypeThermocouple,
  Pt100RTD,
  Pt1000RTD,
  Cu50RTD
};