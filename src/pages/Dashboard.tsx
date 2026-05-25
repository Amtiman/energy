import { useState } from 'react'
import { type EnergyInputs, calculateAll } from '../utils/energyCalculations'
import { InputPanel } from '../components/InputPanel'
import { EnergySourceCard } from '../components/EnergySourceCard'
import { ComparisonChart } from '../components/ComparisonChart'
import { RecommendationBanner } from '../components/RecommendationBanner'

const DEFAULT_INPUTS: EnergyInputs = {
  watts: 0,
  phase: 'single',
  hoursPerDay: 8,
  pricePerKwh: 0,
  dieselPrice: 0,
  solarBudget: 0,
  solarPanelCount: 0,
  solarPanelWatts: 400,
  solarCapacityKw: 0,
}

export function Dashboard() {
  const [inputs, setInputs] = useState<EnergyInputs>(DEFAULT_INPUTS)
  const results = calculateAll(inputs)

  return (
    <div className="dashboard">
      <InputPanel inputs={inputs} onChange={setInputs} />

      <main className="dashboard__results">
        <div className="cards-row">
          <EnergySourceCard
            source="electricity"
            electricity={results.electricity}
            isBestValue={results.recommendation.bestOption === 'electricity'}
          />
          <EnergySourceCard
            source="generator"
            generator={results.generator}
            isBestValue={results.recommendation.bestOption === 'generator'}
          />
          <EnergySourceCard
            source="solar"
            solar={results.solar}
            isBestValue={results.recommendation.bestOption === 'solar'}
          />
        </div>

        <ComparisonChart
          recommendation={results.recommendation}
          hasSolarBudget={inputs.solarBudget > 0}
        />

        <RecommendationBanner recommendation={results.recommendation} solarCoveragePct={results.solar.coveragePct} />
      </main>
    </div>
  )
}
