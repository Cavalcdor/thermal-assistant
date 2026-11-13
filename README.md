[English](README.md) | [简体中文](README.zh-CN.md)

# Thermal Assistant

A native **WeChat Mini Program** for temperature/sensor conversion, pressure-instrument calibration calculations and engineering unit conversion. The application is named **工控热工宝** in its Chinese interface.

Core calculations work locally, including in weak-network industrial environments. The app provides input validation, configurable vibration feedback, local history and result precision settings without requiring an account.

## Temperature and sensor conversion

Convert temperature to thermocouple EMF or RTD resistance, or calculate temperature from a measured signal. Thermocouple mode includes cold-junction compensation. Inputs outside the selected sensor range are rejected.

| Sensor | Range |
| --- | --- |
| K thermocouple | −200 to 1372 °C |
| E thermocouple | −200 to 1000 °C |
| S thermocouple | 0 to 1768 °C |
| B thermocouple | 200 to 1820 °C |
| R thermocouple | 0 to 1768 °C |
| J thermocouple | −200 to 1200 °C |
| N thermocouple | −200 to 1300 °C |
| T thermocouple | −200 to 400 °C |
| Pt100 / Pt1000 | −200 to 850 °C |
| Cu50 | −50 to 150 °C |

The documented algorithms reference ITS-90 thermocouple polynomials and IEC 60751:2008 / JJG 229-2010 for resistance thermometry. Results default to four decimal places and can be configured from zero to six.

## Pressure calibration calculations

### Pressure gauges

Enter the instrument identifier, type, lower/upper limits, accuracy class, ambient temperature and humidity. The tool calculates error limits, generates points at 0%, 25%, 50%, 75% and 100% of span, computes ascending/descending indication errors and produces per-point and overall pass/fail results. The documentation references JJG 52-2013.

### Pressure transmitters

Supports standard 4–20 mA output, configurable measurement/output ranges and accuracy class. Calculate theoretical current at calibration points, enter measured ascending/descending currents, and evaluate indication and hysteresis errors. Zero/span shifts and complete calibration records are supported. The documentation references JJG 882-2019.

## Unit conversion

- Pressure: MPa, bar, psi, kPa, mmHg and atm, with synchronized bidirectional conversion.
- Temperature: Celsius, Fahrenheit and kelvin.
- CEMS gas concentrations: ppm and mg/m³ under the documented standard conditions, using `mg/m³ = ppm × molar_mass / 22.4`. Includes SO₂, NOₓ and NO, plus configurable molar mass.

The original documentation cites GB 3100-1993 for units and HJ 75-2017 for continuous emissions monitoring.

## History and preferences

The profile area can view, restore, delete or clear calculation/calibration history. Precision is configured independently for thermocouples, RTDs and pressure calculations, from 0–6 decimal places, default 4. Vibration reminders default to enabled. History and settings use Mini Program local storage. Version information and algorithm references are available in the app.

## Setup

Requirements: Windows or macOS, WeChat Developer Tools Stable 1.06+ and a registered Mini Program AppID. The original documented runtime baseline is Mini Program base library 2.0+; decimal.js 10.4.3 provides decimal arithmetic.

```sh
git clone https://github.com/Cavalcdor/thermal-assistant.git
cd thermal-assistant
```

1. Set your AppID in `project.config.json`.
2. Import the repository root as a Mini Program project in WeChat Developer Tools.
3. Compile and test in the simulator, then use Preview or device debugging to test on a phone.
4. To publish your own deployment, upload a version through the tools, submit it for review in the WeChat Mini Program console and release it after approval.

Keep personal configuration in `project.private.config.json` out of Git. The README's screenshot section is a placeholder; it does not provide actual interface screenshots.

## Source layout

| Path | Purpose |
| --- | --- |
| `pages/thermal/` | Sensor conversion page |
| `pages/pressure/` | Pressure calibration page |
| `pages/tools/` | Unit conversion page |
| `pages/profile/` | History, settings and version information |
| `utils/decimal.js` | Decimal arithmetic |
| `utils/thermocouple.js` | Thermocouple algorithms |
| `utils/rtd.js` | RTD algorithms |
| `utils/storage.js` | Storage wrapper |
| `utils/common.js` | Shared helpers |
| `minitest/` | Temperature, pressure and utility tests |
| `images/` | Tab-bar icons and other resources |
| `app.js`, `app.json`, `app.wxss` | Application entry, routes/configuration and global styles |
| `project.config.json` | Developer Tools configuration |
| `sitemap.json` | WeChat search indexing configuration |

`app.json` declares the four page routes, window appearance and tab-bar icons. Existing Chinese display strings are application labels and are not changed by translating this README.

## Development

Use ES6+, semicolons, two-space indentation, camelCase variables and uppercase underscore-separated constants. Keep reusable algorithms in `utils/`, shared styles in `app.wxss` and page-specific styles with their pages. Use `rpx` for screen adaptation and route storage calls through `utils/storage.js`.

To add a sensor, define its coefficients and range in `utils/thermocouple.js` or `utils/rtd.js`, implement forward/inverse conversion, add it to the selection list in `pages/thermal/thermal.js`, and add tests under `minitest/` before submitting the change. Test full-range accuracy, out-of-range inputs, vibration/storage on devices and iOS/Android screen compatibility.

## Recorded release

**v1.0.0, 2026-02-15:** Initial project structure; eight thermocouple and three RTD models; gauge and transmitter calculations; pressure, temperature and gas conversions; local history and preferences; documented algorithm and mobile compatibility testing.

## Disclaimer

This is an auxiliary calculation tool. Results are for reference and have no statutory metrological authority; they do not replace legally recognized instruments, reference calibration equipment or professional metrological verification. Users are responsible for actions and decisions based on the results. The original project disclaims liability for errors, software faults and resulting losses, and prohibits use contrary to applicable laws and metrology rules.

## License

See [LICENSE](LICENSE) for the applicable terms.

Maintained by Cavalcdor. The original release documentation is dated 2026-02-15.
