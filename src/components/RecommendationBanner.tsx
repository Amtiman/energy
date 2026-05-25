import { useTranslation } from 'react-i18next'
import type { RecommendationResult } from '../utils/energyCalculations'
import { fmtXAF } from '../utils/format'

interface Props {
  recommendation: RecommendationResult
  solarCoveragePct: number | null
}

export function RecommendationBanner({ recommendation, solarCoveragePct }: Props) {
  const { t } = useTranslation()

  if (!recommendation.bestOption) return null

  const savings = fmtXAF(recommendation.savingsAmount)

  let key = `recommendation.${recommendation.bestOption}`
  const params: Record<string, string | number> = { savings }

  if (recommendation.bestOption === 'solar' && solarCoveragePct !== null && solarCoveragePct < 100) {
    key = 'recommendation.solarPartial'
    params.coverage = solarCoveragePct
    params.remaining = 100 - solarCoveragePct
  }

  return (
    <div className="recommendation-banner">
      {t(key, params)}
    </div>
  )
}
