// ── Types ──────────────────────────────────────────────────────────

export interface EnergyInputs {
  watts: number
  phase: 'single' | 'three'
  hoursPerDay: number
  pricePerKwh: number
  dieselPrice: number
  solarBudget: number
  solarPanelCount: number
  solarPanelWatts: number
  solarCapacityKw: number   // direct override; if > 0 takes priority over panel calc
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

export function calculateSolar(inputs: EnergyInputs, electricity: ElectricityResult): SolarResult {
  if (inputs.watts <= 0) {
    return { panelsNeeded: 0, panelWatts: 0, totalCapacityKw: 0, coveragePct: null, batteryKwh: 0, totalBudget: 0, monthlyAmortized: 0, paybackYears: null, annualSavings: 0 }
  }
  const kW = inputs.watts / 1000
  const panelWatts = inputs.solarPanelWatts > 0 ? inputs.solarPanelWatts : 400

  // Capacity priority: direct entry > panel count × watts
  const panelCalcKw = (inputs.solarPanelCount * panelWatts) / 1000
  const totalCapacityKw = inputs.solarCapacityKw > 0 ? inputs.solarCapacityKw : panelCalcKw

  // Panel count: back-calculate from capacity+watts when capacity is directly entered
  const panelsNeeded = inputs.solarCapacityKw > 0 && inputs.solarPanelWatts > 0
    ? Math.ceil((inputs.solarCapacityKw * 1000) / panelWatts)
    : inputs.solarPanelCount

  // Coverage: what % of device peak load the panels can supply
  const coveragePct = panelsNeeded > 0
    ? Math.min(100, Math.round((totalCapacityKw / kW) * 100))
    : null
  const coverageRatio = coveragePct !== null ? coveragePct / 100 : 1

  // Battery sized for device daily consumption (energy storage, in kWh)
  const batteryKwh = Math.ceil((kW * inputs.hoursPerDay) / 0.5 / 0.9)

  const totalBudget = inputs.solarBudget
  const monthlyAmortized = totalBudget > 0 ? totalBudget / 60 : 0

  // Savings scale with coverage: partial panels = partial electricity offset
  const annualSavings = electricity.annualCost * coverageRatio
  const paybackYears =
    totalBudget > 0 && annualSavings > 0
      ? parseFloat((totalBudget / annualSavings).toFixed(1))
      : null

  return { panelsNeeded, panelWatts, totalCapacityKw, coveragePct, batteryKwh, totalBudget, monthlyAmortized, paybackYears, annualSavings }
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
  const solarFiveYear = inputs.solarBudget > 0
    ? inputs.solarBudget + residualElec5yr
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
