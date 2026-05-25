import { useTranslation } from 'react-i18next'
import { fmtXAF } from '../utils/format'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { RecommendationResult } from '../utils/energyCalculations'

// Recharts Cell.fill requires literal hex — must match brand.css raw tokens
const CHART_COLORS = {
  electricity: '#2E3192', // --brand-blue
  generator: '#F59E0B',   // --brand-amber
  solar: '#0A823B',       // --brand-green
}

const AXIS_TICK_SIZE = 12
const AXIS_TICK_SIZE_SM = 11

interface Props {
  recommendation: RecommendationResult
  hasSolarBudget: boolean
}

export function ComparisonChart({ recommendation, hasSolarBudget }: Props) {
  const { t } = useTranslation()

  const data = [
    {
      name: t('sources.electricity'),
      cost: recommendation.fiveYearTotals.electricity,
      fill: CHART_COLORS.electricity,
    },
    {
      name: t('sources.generator'),
      cost: recommendation.fiveYearTotals.generator,
      fill: CHART_COLORS.generator,
    },
    ...(hasSolarBudget
      ? [
          {
            name: t('sources.solar'),
            cost: recommendation.fiveYearTotals.solar,
            fill: CHART_COLORS.solar,
          },
        ]
      : []),
  ]

  return (
    <div className="comparison-chart">
      <h3 className="comparison-chart__title">{t('chart.title')}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: AXIS_TICK_SIZE }} />
          <YAxis
            tick={{ fontSize: AXIS_TICK_SIZE_SM }}
            tickFormatter={v => fmtXAF(Number(v))}
            width={70}
          />
          <Tooltip
            formatter={(value: number | string | Array<number | string>) => [fmtXAF(Number(value)), t('chart.costLabel')]}
          />
          <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {hasSolarBudget && (
        <p className="comparison-chart__note">{t('chart.note')}</p>
      )}
    </div>
  )
}
