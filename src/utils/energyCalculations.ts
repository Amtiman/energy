// ── Types ──────────────────────────────────────────────────────────

export interface EnergyInputs {
  watts: number
  phase: 'single' | 'three'
  hoursPerDay: number
  pricePerKwh: number
  dieselPrice: number
  panelUnitPrice: number    // price of a single panel; total = unit price × calculated quantity
  inverterPrice: number     // price of the inverter
  solarPanelWatts: number   // user-entered capacity per panel; drives auto panel count + array capacity
  peakSunHours: number      // equivalent hours of full-rated sun per day (location-specific)
  systemEfficiencyPct: number // overall system efficiency % (losses: inverter, wiring, heat, dust, battery)
  mountingFactor: number    // installation-area multiplier over raw panel footprint (tilt, row gaps, walkways)
}

export interface ElectricityResult {
  dailyKwh: number
  monthlyCost: number
  annualCost: number
}

export interface GeneratorResult {
  generatorKva: number
  fuelPerHour: number
  dailyFuel: number
  monthlyFuelCost: number
  annualFuelCost: number
}

export interface SolarResult {
  panelsNeeded: number
  panelWatts: number
  inverterKva: number          // inverter capacity sized to the device load
  panelAreaM2: number          // approximate surface area needed to fit all panels
  totalCapacityKw: number
  coveragePct: number | null   // % of device peak load covered; null when no panels entered
  batteryKwh: number
  totalBudget: number
  monthlyAmortized: number     // budget / 60, used internally for chart comparison
  paybackYears: number | null
  annualSavings: number
}

export interface RecommendationResult {
  bestOption: 'electricity' | 'generator' | 'solar' | null
  fiveYearTotals: {
    electricity: number
    generator: number
    solar: number
  }
  savingsAmount: number
  savingsVs: 'electricity' | 'generator' | 'solar' | null
}

export interface AllResults {
  electricity: ElectricityResult
  generator: GeneratorResult
  solar: SolarResult
  recommendation: RecommendationResult
}

// ── Electricity ────────────────────────────────────────────────────

export function calculateElectricity(inputs: EnergyInputs): ElectricityResult {
  if (inputs.watts <= 0) return { dailyKwh: 0, monthlyCost: 0, annualCost: 0 }
  const kW = inputs.watts / 1000
  const dailyKwh = kW * inputs.hoursPerDay
  return {
    dailyKwh,
    monthlyCost: dailyKwh * inputs.pricePerKwh * 30,
    annualCost: dailyKwh * inputs.pricePerKwh * 365,
  }
}

// ── Generator ──────────────────────────────────────────────────────

const STANDARD_KVA = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]

// Single-phase motors have poor starting (capacitor-start, high inrush) → 2.5×
// Three-phase motors start smoothly with balanced load → 2.0×
const STARTING_FACTOR = { single: 2.5, three: 2.0 }

export function calculateGenerator(inputs: EnergyInputs): GeneratorResult {
  if (inputs.watts <= 0) {
    return { generatorKva: 0, fuelPerHour: 0, dailyFuel: 0, monthlyFuelCost: 0, annualFuelCost: 0 }
  }
  const kW = inputs.watts / 1000
  const pf = inputs.phase === 'three' ? 0.85 : 0.8
  const surgeFactor = STARTING_FACTOR[inputs.phase]
  const requiredKva = (kW / pf) * surgeFactor
  const generatorKva = STANDARD_KVA.find(s => s >= requiredKva) ?? STANDARD_KVA[STANDARD_KVA.length - 1]
  // Fuel is based on the generator's rated kW, not the device load.
  // Diesel generators burn ~0.25 L per rated kW/h regardless of partial load.
  const generatorKw = generatorKva * 0.8
  const fuelPerHour = generatorKw * 0.25
  const dailyFuel = fuelPerHour * inputs.hoursPerDay
  return {
    generatorKva,
    fuelPerHour,
    dailyFuel,
    monthlyFuelCost: dailyFuel * 30 * inputs.dieselPrice,
    annualFuelCost: dailyFuel * 365 * inputs.dieselPrice,
  }
}

// ── Solar ──────────────────────────────────────────────────────────

// Standard inverter ratings (kVA), used to round the required capacity up to a real product size.
const STANDARD_INVERTER_KVA = [1, 2, 3, 5, 7.5, 10, 15, 20, 25, 30, 40, 50]

// Solar resource & system assumptions (used as fallbacks when the user leaves a field blank)
const DEFAULT_PEAK_SUN_HOURS = 5   // equivalent hours of full-rated sun per day (≈ Central Africa / XAF zone)
const DEFAULT_SYSTEM_DERATE = 0.75 // combined losses: inverter, wiring, temperature, dust, battery round-trip
const BATTERY_DOD = 0.5            // usable depth of discharge (preserves battery lifespan)
const BATTERY_EFFICIENCY = 0.9     // round-trip storage efficiency
const PANEL_POWER_DENSITY = 200    // W/m² (≈ 20% module efficiency at 1000 W/m²) → panel area = watts / this
const DEFAULT_MOUNTING_FACTOR = 1.3 // flush-rooftop default; ground mounts need more (≈1.7+)

export function calculateSolar(inputs: EnergyInputs, electricity: ElectricityResult): SolarResult {
  if (inputs.watts <= 0) {
    return { panelsNeeded: 0, panelWatts: 0, inverterKva: 0, panelAreaM2: 0, totalCapacityKw: 0, coveragePct: null, batteryKwh: 0, totalBudget: 0, monthlyAmortized: 0, paybackYears: null, annualSavings: 0 }
  }
  const kW = inputs.watts / 1000
  const panelWatts = inputs.solarPanelWatts > 0 ? inputs.solarPanelWatts : 400

  // Energy-based sizing: the array must replenish the FULL daily kWh during the limited
  // peak-sun window (not the device run hours), after system losses. This is why the panel
  // count and capacity grow with the number of working hours per day.
  const dailyKwh = electricity.dailyKwh                       // kW × hoursPerDay
  const peakSunHours = inputs.peakSunHours > 0 ? inputs.peakSunHours : DEFAULT_PEAK_SUN_HOURS
  const derate = inputs.systemEfficiencyPct > 0 ? inputs.systemEfficiencyPct / 100 : DEFAULT_SYSTEM_DERATE
  const requiredArrayKw = dailyKwh / peakSunHours / derate
  const panelsNeeded = Math.ceil((requiredArrayKw * 1000) / panelWatts)
  const totalCapacityKw = (panelsNeeded * panelWatts) / 1000

  // Approximate installation area: raw panel footprint (≈ watts ÷ power density) scaled by the
  // mounting factor to account for tilt, row spacing and walkways.
  const mountingFactor = inputs.mountingFactor > 0 ? inputs.mountingFactor : DEFAULT_MOUNTING_FACTOR
  const panelAreaM2 = ((panelsNeeded * panelWatts) / PANEL_POWER_DENSITY) * mountingFactor

  // Inverter sized to the device's continuous load (kVA) with 25% headroom, then
  // rounded up to the next standard inverter size. Power-based — independent of run hours.
  const pf = inputs.phase === 'three' ? 0.85 : 0.8
  const requiredInverterKva = (kW / pf) * 1.25
  const inverterKva = STANDARD_INVERTER_KVA.find(s => s >= requiredInverterKva)
    ?? STANDARD_INVERTER_KVA[STANDARD_INVERTER_KVA.length - 1]

  // Sized to meet the full daily energy, so a configured system covers 100% of the load.
  const coveragePct = panelsNeeded > 0 ? 100 : null
  const coverageRatio = coveragePct !== null ? coveragePct / 100 : 1

  // Battery sized to store one full day of consumption (autonomy through non-sun hours).
  // Grows with working hours via dailyKwh.
  const batteryKwh = Math.ceil(dailyKwh / BATTERY_DOD / BATTERY_EFFICIENCY)

  // Total install budget = (unit panel price × quantity) + inverter price
  const totalBudget = inputs.panelUnitPrice * panelsNeeded + inputs.inverterPrice
  const monthlyAmortized = totalBudget > 0 ? totalBudget / 60 : 0

  // Savings scale with coverage: partial panels = partial electricity offset
  const annualSavings = electricity.annualCost * coverageRatio
  const paybackYears =
    totalBudget > 0 && annualSavings > 0
      ? parseFloat((totalBudget / annualSavings).toFixed(1))
      : null

  return { panelsNeeded, panelWatts, inverterKva, panelAreaM2, totalCapacityKw, coveragePct, batteryKwh, totalBudget, monthlyAmortized, paybackYears, annualSavings }
}

// ── Recommendation ─────────────────────────────────────────────────

export function calculateRecommendation(
  inputs: EnergyInputs,
  electricity: ElectricityResult,
  generator: GeneratorResult,
  solar: SolarResult
): RecommendationResult {
  if (inputs.watts <= 0) {
    return {
      bestOption: null,
      fiveYearTotals: { electricity: 0, generator: 0, solar: 0 },
      savingsAmount: 0,
      savingsVs: null,
    }
  }

  // If panels are specified and don't fully cover the load, residual electricity
  // cost is added to the 5-year solar total for a fair comparison.
  const coverageRatio = solar.coveragePct !== null ? solar.coveragePct / 100 : 1
  const residualElec5yr = (1 - Math.min(1, coverageRatio)) * electricity.annualCost * 5
  const solarFiveYear = solar.totalBudget > 0
    ? solar.totalBudget + residualElec5yr
    : Infinity

  const raw = {
    electricity: electricity.annualCost * 5,
    generator: generator.annualFuelCost * 5,
    solar: solarFiveYear,
  }

  const entries = Object.entries(raw) as Array<[keyof typeof raw, number]>
  const sorted = [...entries].sort((a, b) => a[1] - b[1])
  const [bestOption, bestCost] = sorted[0]
  const [savingsVs, secondCost] = sorted[1]

  return {
    bestOption,
    fiveYearTotals: {
      electricity: raw.electricity,
      generator: raw.generator,
      solar: raw.solar === Infinity ? 0 : raw.solar,
    },
    savingsAmount: secondCost === Infinity ? 0 : secondCost - bestCost,
    savingsVs,
  }
}

// ── calculateAll ───────────────────────────────────────────────────

export function calculateAll(inputs: EnergyInputs): AllResults {
  const electricity = calculateElectricity(inputs)
  const generator = calculateGenerator(inputs)
  const solar = calculateSolar(inputs, electricity)
  const recommendation = calculateRecommendation(inputs, electricity, generator, solar)
  return { electricity, generator, solar, recommendation }
}
