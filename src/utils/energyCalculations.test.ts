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
  solarBudget: 0,
  solarPanelCount: 0,
  solarPanelWatts: 400,
  solarCapacityKw: 0,
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

  it('uses user-specified panel count and wattage', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarPanelCount: 5, solarPanelWatts: 550 }, elec)
    expect(r.panelsNeeded).toBe(5)
    expect(r.panelWatts).toBe(550)
    expect(r.totalCapacityKw).toBeCloseTo(2.75)  // 5 × 550W = 2750W
  })

  it('uses solarCapacityKw directly when provided, ignoring panel calc', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarCapacityKw: 12, solarPanelCount: 5, solarPanelWatts: 400 }, elec)
    expect(r.totalCapacityKw).toBe(12)   // 12 kW direct override, not 5×400/1000 = 2 kW
  })

  it('defaults panel wattage to 400 when solarPanelWatts is 0', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarPanelCount: 2, solarPanelWatts: 0 }, elec)
    expect(r.panelWatts).toBe(400)
    expect(r.totalCapacityKw).toBeCloseTo(0.8)  // 2 × 400W = 800W
  })

  it('calculates battery bank in kWh with 50% DoD and 90% efficiency', () => {
    // 1kW × 10h = 10 kWh; / 0.5 / 0.9 = 22.2 → ceil = 23 kWh
    const elec = calculateElectricity(BASE)
    const r = calculateSolar(BASE, elec)
    expect(r.batteryKwh).toBe(23)
  })

  it('calculates coverage percentage', () => {
    const elec = calculateElectricity(BASE)
    // 4 × 400W = 1.6 kW vs 1 kW device → 160% (capped at 100)
    const full = calculateSolar({ ...BASE, solarPanelCount: 4, solarPanelWatts: 400 }, elec)
    expect(full.coveragePct).toBe(100)
    // 1 × 200W = 0.2 kW vs 1 kW device → 20%
    const partial = calculateSolar({ ...BASE, solarPanelCount: 1, solarPanelWatts: 200 }, elec)
    expect(partial.coveragePct).toBe(20)
  })

  it('scales annualSavings by coverage ratio', () => {
    const elec = calculateElectricity({ ...BASE, pricePerKwh: 90 })
    // 0.5 kW panels vs 1 kW device → 50% coverage → savings = 50% of electricity cost
    const r = calculateSolar({ ...BASE, solarPanelCount: 1, solarPanelWatts: 500, pricePerKwh: 90 }, elec)
    expect(r.annualSavings).toBeCloseTo(elec.annualCost * 0.5)
  })

  it('returns null payback when solarBudget is 0', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarBudget: 0 }, elec)
    expect(r.paybackYears).toBeNull()
    expect(r.monthlyAmortized).toBe(0)
  })

  it('calculates payback when budget and full coverage provided', () => {
    // 1kW device, pricePerKwh=0.10, 10h/day → annualCost = $365
    // budget = $730, panels cover 100% → payback = 2 years
    const inputs = { ...BASE, pricePerKwh: 0.10, solarBudget: 730, solarPanelCount: 3, solarPanelWatts: 400 }
    const elec = calculateElectricity(inputs)
    const r = calculateSolar(inputs, elec)
    expect(r.coveragePct).toBe(100)
    expect(r.paybackYears).toBe(2)
    expect(r.totalBudget).toBe(730)
    expect(r.monthlyAmortized).toBeCloseTo(730 / 60)
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

  it('excludes solar from comparison when solarBudget is 0', () => {
    // 5yr: electricity=$1825, generator=$4562.5, solar=Infinity → electricity wins
    const elec = calculateElectricity(BASE)
    const gen = calculateGenerator(BASE)
    const sol = calculateSolar(BASE, elec)
    const r = calculateRecommendation(BASE, elec, gen, sol)
    expect(r.bestOption).toBe('electricity')
  })

  it('picks solar when its 5-year cost is lowest', () => {
    // solar=$500, electricity=$1825, generator=$4562.5 → solar wins
    const inputs = { ...BASE, solarBudget: 500 }
    const elec = calculateElectricity(inputs)
    const gen = calculateGenerator(inputs)
    const sol = calculateSolar(inputs, elec)
    const r = calculateRecommendation(inputs, elec, gen, sol)
    expect(r.bestOption).toBe('solar')
    expect(r.savingsAmount).toBeCloseTo(1825 - 500)
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
