import { describe, it, expect } from 'vitest'
import {
  calculateElectricity,
  calculateGenerator,
  calculateSolar,
  calculateRecommendation,
  calculateAll,
} from './energyCalculations'

const BASE = {
  watts: 1000,
  phase: 'single' as const,
  hoursPerDay: 10,
  pricePerKwh: 0.10,
  dieselPrice: 1.00,
  panelUnitPrice: 0,
  inverterPrice: 0,
  solarPanelWatts: 400,
  peakSunHours: 5,
  systemEfficiencyPct: 75,
  mountingFactor: 1.3,
}

describe('calculateElectricity', () => {
  it('returns zero values when watts is 0', () => {
    const r = calculateElectricity({ ...BASE, watts: 0 })
    expect(r.dailyKwh).toBe(0)
    expect(r.monthlyCost).toBe(0)
    expect(r.annualCost).toBe(0)
  })

  it('returns zero values for negative watts', () => {
    const r = calculateElectricity({ ...BASE, watts: -1000 })
    expect(r.dailyKwh).toBe(0)
    expect(r.annualCost).toBe(0)
  })

  it('calculates daily kWh correctly', () => {
    const r = calculateElectricity(BASE)   // 1kW × 10h = 10 kWh/day
    expect(r.dailyKwh).toBe(10)
  })

  it('calculates monthly cost', () => {
    const r = calculateElectricity(BASE)   // 10 × 0.10 × 30 = $30
    expect(r.monthlyCost).toBeCloseTo(30)
  })

  it('calculates annual cost', () => {
    const r = calculateElectricity(BASE)   // 10 × 0.10 × 365 = $365
    expect(r.annualCost).toBeCloseTo(365)
  })
})

describe('calculateGenerator', () => {
  it('returns zero values when watts is 0', () => {
    const r = calculateGenerator({ ...BASE, watts: 0 })
    expect(r.generatorKva).toBe(0)
    expect(r.dailyFuel).toBe(0)
  })

  it('returns zero values for negative watts', () => {
    const r = calculateGenerator({ ...BASE, watts: -500 })
    expect(r.generatorKva).toBe(0)
  })

  it('rounds up to next standard kVA size with single-phase surge factor 2.5×', () => {
    // 1kW / 0.8 × 2.5 = 3.125 kVA → 5 kVA
    const r = calculateGenerator(BASE)
    expect(r.generatorKva).toBe(5)
  })

  it('selects 25 kVA for a 7kW single-phase device', () => {
    // 7kW / 0.8 × 2.5 = 21.875 kVA → 25 kVA
    const r = calculateGenerator({ ...BASE, watts: 7000 })
    expect(r.generatorKva).toBe(25)
  })

  it('selects smaller kVA for three-phase (surge 2.0×) vs single-phase (surge 2.5×)', () => {
    // single: 7kW / 0.8 × 2.5 = 21.875 → 25 kVA
    // three:  7kW / 0.85 × 2.0 = 16.47 → 20 kVA
    const single = calculateGenerator({ ...BASE, watts: 7000, phase: 'single' })
    const three  = calculateGenerator({ ...BASE, watts: 7000, phase: 'three' })
    expect(single.generatorKva).toBe(25)
    expect(three.generatorKva).toBe(20)
    expect(three.generatorKva).toBeLessThan(single.generatorKva)
  })

  it('calculates fuel consumption based on generator rated kW', () => {
    // 1kW device → 5 kVA generator; rated kW = 5 × 0.8 = 4 kW
    // fuelPerHour = 4 × 0.25 = 1.0 L/h; × 10h = 10 L/day
    const r = calculateGenerator(BASE)
    expect(r.fuelPerHour).toBeCloseTo(1.0)
    expect(r.dailyFuel).toBeCloseTo(10)
    expect(r.monthlyFuelCost).toBeCloseTo(300)   // 10 × 30 × 1.00
    expect(r.annualFuelCost).toBeCloseTo(3650)   // 10 × 365 × 1.00
  })
})

describe('calculateSolar', () => {
  it('returns zero values when watts is 0', () => {
    const elec = calculateElectricity({ ...BASE, watts: 0 })
    const r = calculateSolar({ ...BASE, watts: 0 }, elec)
    expect(r.panelsNeeded).toBe(0)
    expect(r.batteryKwh).toBe(0)
    expect(r.coveragePct).toBeNull()
  })

  it('sizes the array by daily energy, peak-sun-hours and losses', () => {
    const elec = calculateElectricity(BASE)
    // 1kW × 10h = 10 kWh/day; 10 / 5 sun-h / 0.75 = 2.67 kW array
    // 2.67 kW / 550W per panel → ceil(4.85) = 5 panels; 5 × 550W = 2.75 kW
    const r = calculateSolar({ ...BASE, solarPanelWatts: 550 }, elec)
    expect(r.panelsNeeded).toBe(5)
    expect(r.panelWatts).toBe(550)
    expect(r.totalCapacityKw).toBeCloseTo(2.75)
  })

  it('grows the array with daily working hours (energy, not peak power)', () => {
    const short = calculateSolar(
      { ...BASE, hoursPerDay: 5 },
      calculateElectricity({ ...BASE, hoursPerDay: 5 })
    )
    const long = calculateSolar(
      { ...BASE, hoursPerDay: 10 },
      calculateElectricity({ ...BASE, hoursPerDay: 10 })
    )
    // 5 kWh/day → 1.33 kW → 4 × 400W;  10 kWh/day → 2.67 kW → 7 × 400W
    expect(short.panelsNeeded).toBe(4)
    expect(long.panelsNeeded).toBe(7)
    expect(long.panelsNeeded).toBeGreaterThan(short.panelsNeeded)
  })

  it('needs fewer panels in sunnier locations (higher peak sun hours)', () => {
    // 10 kWh/day, 0.75 derate. 5 sun-h → 2.67 kW → 7 panels; 10 sun-h → 1.33 kW → 4 panels
    const sunny = calculateSolar({ ...BASE, peakSunHours: 10 }, calculateElectricity(BASE))
    const cloudy = calculateSolar({ ...BASE, peakSunHours: 5 }, calculateElectricity(BASE))
    expect(sunny.panelsNeeded).toBe(4)
    expect(cloudy.panelsNeeded).toBe(7)
    expect(sunny.panelsNeeded).toBeLessThan(cloudy.panelsNeeded)
  })

  it('needs more panels as system efficiency drops', () => {
    // 10 kWh/day, 5 sun-h. 75% → 2.67 kW → 7 panels; 50% → 4.0 kW → 10 panels
    const efficient = calculateSolar({ ...BASE, systemEfficiencyPct: 75 }, calculateElectricity(BASE))
    const lossy = calculateSolar({ ...BASE, systemEfficiencyPct: 50 }, calculateElectricity(BASE))
    expect(efficient.panelsNeeded).toBe(7)
    expect(lossy.panelsNeeded).toBe(10)
    expect(lossy.panelsNeeded).toBeGreaterThan(efficient.panelsNeeded)
  })

  it('falls back to defaults (5 sun-h, 75%) when those fields are blank', () => {
    const r = calculateSolar({ ...BASE, peakSunHours: 0, systemEfficiencyPct: 0 }, calculateElectricity(BASE))
    expect(r.panelsNeeded).toBe(7)
  })

  it('defaults panel wattage to 400 when solarPanelWatts is 0', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarPanelWatts: 0 }, elec)
    expect(r.panelWatts).toBe(400)
    // 10 kWh/day → 2.67 kW array / 400W → ceil(6.67) = 7 panels; 7 × 400W = 2.8 kW
    expect(r.panelsNeeded).toBe(7)
    expect(r.totalCapacityKw).toBeCloseTo(2.8)
  })

  it('estimates installation area from footprint × mounting factor', () => {
    const elec = calculateElectricity(BASE)
    // BASE → 7 panels × 400W = 2800W; 2800 / 200 W/m² = 14 m² footprint × 1.3 = 18.2 m²
    const r = calculateSolar(BASE, elec)
    expect(r.panelAreaM2).toBeCloseTo(18.2)
  })

  it('scales installation area with the mounting factor (and falls back to 1.3)', () => {
    const elec = calculateElectricity(BASE)
    const ground = calculateSolar({ ...BASE, mountingFactor: 1.7 }, elec)
    const fallback = calculateSolar({ ...BASE, mountingFactor: 0 }, elec)
    expect(ground.panelAreaM2).toBeCloseTo(14 * 1.7)   // 23.8 m²
    expect(fallback.panelAreaM2).toBeCloseTo(14 * 1.3) // blank → default 1.3
  })

  it('calculates battery bank in kWh with 50% DoD and 90% efficiency', () => {
    // 1kW × 10h = 10 kWh; / 0.5 / 0.9 = 22.2 → ceil = 23 kWh
    const elec = calculateElectricity(BASE)
    const r = calculateSolar(BASE, elec)
    expect(r.batteryKwh).toBe(23)
  })

  it('reports 100% coverage when sized to meet daily energy', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar(BASE, elec)
    expect(r.panelsNeeded).toBe(7)
    expect(r.coveragePct).toBe(100)
  })

  it('saves the full electricity cost at 100% coverage', () => {
    const elec = calculateElectricity({ ...BASE, pricePerKwh: 90 })
    const r = calculateSolar({ ...BASE, pricePerKwh: 90 }, elec)
    expect(r.annualSavings).toBeCloseTo(elec.annualCost)
  })

  it('returns null payback when no prices are entered', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, panelUnitPrice: 0, inverterPrice: 0 }, elec)
    expect(r.paybackYears).toBeNull()
    expect(r.monthlyAmortized).toBe(0)
  })

  it('builds the total budget from unit price × calculated quantity + inverter price', () => {
    const elec = calculateElectricity(BASE)
    // BASE energy sizing → 7 panels; 7 × 200 = 1400 panels + 130 inverter = 1530
    const r = calculateSolar({ ...BASE, panelUnitPrice: 200, inverterPrice: 130 }, elec)
    expect(r.panelsNeeded).toBe(7)
    expect(r.totalBudget).toBe(1530)
  })

  it('calculates payback when budget and full coverage provided', () => {
    // 1kW device, pricePerKwh=0.10, 10h/day → annualCost = $365
    // 7 panels × $100 = $700 + $30 inverter = $730, covers 100% → payback = 2 years
    const inputs = { ...BASE, pricePerKwh: 0.10, panelUnitPrice: 100, inverterPrice: 30, solarPanelWatts: 400 }
    const elec = calculateElectricity(inputs)
    const r = calculateSolar(inputs, elec)
    expect(r.panelsNeeded).toBe(7)
    expect(r.coveragePct).toBe(100)
    expect(r.paybackYears).toBe(2)
    expect(r.totalBudget).toBe(730)
    expect(r.monthlyAmortized).toBeCloseTo(730 / 60)
  })

  it('sizes the inverter to the device load (single-phase, 25% headroom)', () => {
    const elec = calculateElectricity(BASE)
    // 1kW / 0.8 × 1.25 = 1.5625 kVA → next standard size = 2 kVA
    const r = calculateSolar(BASE, elec)
    expect(r.inverterKva).toBe(2)
  })

  it('sizes a larger inverter for a bigger device', () => {
    const elec = calculateElectricity({ ...BASE, watts: 7000 })
    // 7kW / 0.8 × 1.25 = 10.94 kVA → next standard size = 15 kVA
    const r = calculateSolar({ ...BASE, watts: 7000 }, elec)
    expect(r.inverterKva).toBe(15)
  })
})

describe('calculateRecommendation', () => {
  it('returns null bestOption when watts is 0', () => {
    const zero = { ...BASE, watts: 0 }
    const r = calculateRecommendation(
      zero,
      calculateElectricity(zero),
      calculateGenerator(zero),
      calculateSolar(zero, calculateElectricity(zero))
    )
    expect(r.bestOption).toBeNull()
  })

  it('excludes solar from comparison when no prices are entered', () => {
    // 5yr: electricity=$1825, generator=$4562.5, solar=Infinity → electricity wins
    const elec = calculateElectricity(BASE)
    const gen = calculateGenerator(BASE)
    const sol = calculateSolar(BASE, elec)
    const r = calculateRecommendation(BASE, elec, gen, sol)
    expect(r.bestOption).toBe('electricity')
  })

  it('picks solar when its 5-year cost is lowest', () => {
    // 7 panels × $100 = $700 + $200 inverter = $900 install
    // solar=$900, electricity=$1825, generator=$18250 → solar wins
    const inputs = { ...BASE, panelUnitPrice: 100, inverterPrice: 200 }
    const elec = calculateElectricity(inputs)
    const gen = calculateGenerator(inputs)
    const sol = calculateSolar(inputs, elec)
    const r = calculateRecommendation(inputs, elec, gen, sol)
    expect(r.bestOption).toBe('solar')
    expect(r.savingsAmount).toBeCloseTo(1825 - 900)
  })
})

describe('calculateAll', () => {
  it('returns all four result objects', () => {
    const r = calculateAll(BASE)
    expect(r).toHaveProperty('electricity')
    expect(r).toHaveProperty('generator')
    expect(r).toHaveProperty('solar')
    expect(r).toHaveProperty('recommendation')
  })
})
