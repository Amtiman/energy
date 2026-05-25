import { useTranslation } from 'react-i18next'
import type {
  ElectricityResult,
  GeneratorResult,
  SolarResult,
} from '../utils/energyCalculations'
import { fmtXAF } from '../utils/format'

interface Props {
  source: 'electricity' | 'generator' | 'solar'
  electricity?: ElectricityResult
  generator?: GeneratorResult
  solar?: SolarResult
  isBestValue: boolean
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals })
}

export function EnergySourceCard({ source, electricity, generator, solar, isBestValue }: Props) {
  const { t } = useTranslation()
  const icons = { electricity: '⚡', generator: '⛽', solar: '☀️' }

  return (
    <div className={`energy-card${isBestValue ? ' energy-card--best' : ''}`}>
      {isBestValue && <span className="best-badge">{t('bestValue')}</span>}

      <div className="energy-card__header">
        <span className="energy-card__icon">{icons[source]}</span>
        <span className="energy-card__name">{t(`sources.${source}`)}</span>
      </div>

      {source === 'electricity' && electricity && (
        <>
          <div className="energy-card__cost">{fmtXAF(electricity.monthlyCost)}</div>
          <div className="energy-card__unit">{t('metrics.perMonth')}</div>
          <div className="energy-card__meta">
            {t('metrics.annualCost', { value: fmtXAF(electricity.annualCost) })}
          </div>
          <div className="energy-card__meta">
            {t('metrics.dailyKwh', { value: fmt(electricity.dailyKwh) })}
          </div>
        </>
      )}

      {source === 'generator' && generator && (
        <>
          <div className="energy-card__cost">{fmtXAF(generator.monthlyFuelCost)}</div>
          <div className="energy-card__unit">{t('metrics.perMonth')}</div>
          <div className="energy-card__meta">
            {t('metrics.litersPerDay', { value: fmt(generator.dailyFuel) })}
          </div>
          <div className="energy-card__meta">
            {t('metrics.sizeNeeded', { value: generator.generatorKva })}
          </div>
        </>
      )}

      {source === 'solar' && solar && (
        <>
          <div className="energy-card__cost">
            {solar.totalBudget > 0 ? fmtXAF(solar.totalBudget) : '—'}
          </div>
          <div className="energy-card__unit">
            {solar.totalBudget > 0 ? t('metrics.installCost') : t('metrics.enterBudget')}
          </div>
          {solar.totalBudget > 0 && (
            <div className="energy-card__meta">
              {t('metrics.monthlyEquiv', { value: fmtXAF(solar.monthlyAmortized) })}
            </div>
          )}
          <div className="energy-card__meta">
            {solar.panelsNeeded > 0
              ? t('metrics.panelsCount', { count: solar.panelsNeeded, watts: solar.panelWatts })
              : t('metrics.enterPanels')}
          </div>
          {solar.panelsNeeded > 0 && (
            <>
              <div className="energy-card__meta">
                {t('metrics.totalCapacity', { value: fmt(solar.totalCapacityKw, 2) })}
              </div>
              <div className={`energy-card__meta${
                solar.coveragePct !== null && solar.coveragePct >= 100
                  ? ' energy-card__meta--highlight'
                  : ' energy-card__meta--warning'
              }`}>
                {t('metrics.coverage', { value: solar.coveragePct })}
              </div>
            </>
          )}
          <div className="energy-card__meta">
            {t('metrics.batterySize', { value: solar.batteryKwh })}
          </div>
          {solar.paybackYears !== null && (
            <>
              <div className="energy-card__meta energy-card__meta--highlight">
                {t('metrics.payback', { value: solar.paybackYears })}
              </div>
              <div className="energy-card__meta energy-card__meta--disclaimer">
                {t('metrics.paybackNote')}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
