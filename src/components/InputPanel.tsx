import { useTranslation } from 'react-i18next'
import type { EnergyInputs, SolarResult } from '../utils/energyCalculations'
import { fmtXAF } from '../utils/format'

interface Props {
  inputs: EnergyInputs
  onChange: (inputs: EnergyInputs) => void
  solar: SolarResult
}

export function InputPanel({ inputs, onChange, solar }: Props) {
  const { t } = useTranslation()

  function update<K extends keyof EnergyInputs>(key: K, value: EnergyInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  function numericValue(val: number) {
    return val === 0 ? '' : String(val)
  }

  // Panel count / capacity come from the energy-based sizing in calculateSolar,
  // so the hints here always match the result cards.
  const panelsNeeded = solar.panelsNeeded

  return (
    <aside className="input-panel">
      <h2 className="section-label">{t('inputPanel.title')}</h2>

      <label className="field">
        <span className="field-label">{t('inputPanel.devicePower')}</span>
        <input
          type="number"
          min={0}
          value={numericValue(inputs.watts)}
          onChange={e => update('watts', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderWatts')}
        />
      </label>

      <div className="field">
        <span className="field-label">{t('inputPanel.phaseType')}</span>
        <div className="phase-toggle">
          <button
            type="button"
            className={`phase-btn${inputs.phase === 'single' ? ' active' : ''}`}
            onClick={() => update('phase', 'single')}
          >
            {t('inputPanel.singlePhase')}
          </button>
          <button
            type="button"
            className={`phase-btn${inputs.phase === 'three' ? ' active' : ''}`}
            onClick={() => update('phase', 'three')}
          >
            {t('inputPanel.threePhase')}
          </button>
        </div>
      </div>

      <label className="field">
        <span className="field-label">{t('inputPanel.dailyHours')}</span>
        <input
          type="number"
          min={1}
          max={24}
          value={numericValue(inputs.hoursPerDay)}
          onChange={e => update('hoursPerDay', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderHours')}
        />
      </label>

      <hr className="divider" />
      <h2 className="section-label">{t('inputPanel.pricing')}</h2>

      <label className="field">
        <span className="field-label">{t('inputPanel.electricityPrice')}</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={numericValue(inputs.pricePerKwh)}
          onChange={e => update('pricePerKwh', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderElectricity')}
        />
      </label>

      <label className="field">
        <span className="field-label">{t('inputPanel.dieselPrice')}</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={numericValue(inputs.dieselPrice)}
          onChange={e => update('dieselPrice', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderDiesel')}
        />
      </label>

      <label className="field">
        <span className="field-label">{t('inputPanel.panelUnitPrice')}</span>
        <input
          type="number"
          min={0}
          value={numericValue(inputs.panelUnitPrice)}
          onChange={e => update('panelUnitPrice', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderPanelUnitPrice')}
        />
      </label>

      {inputs.panelUnitPrice > 0 && panelsNeeded > 0 && (
        <p className="field-hint">
          {t('inputPanel.calculatedPanelsTotal', {
            value: fmtXAF(inputs.panelUnitPrice * panelsNeeded),
          })}
        </p>
      )}

      <label className="field">
        <span className="field-label">{t('inputPanel.inverterPrice')}</span>
        <input
          type="number"
          min={0}
          value={numericValue(inputs.inverterPrice)}
          onChange={e => update('inverterPrice', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderInverterPrice')}
        />
      </label>

      <label className="field">
        <span className="field-label">{t('inputPanel.solarPanelWatts')}</span>
        <input
          type="number"
          min={1}
          value={numericValue(inputs.solarPanelWatts)}
          onChange={e => update('solarPanelWatts', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderPanelWatts')}
        />
      </label>

      <label className="field">
        <span className="field-label">{t('inputPanel.peakSunHours')}</span>
        <input
          type="number"
          min={1}
          max={12}
          step={0.5}
          value={numericValue(inputs.peakSunHours)}
          onChange={e => update('peakSunHours', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderPeakSunHours')}
        />
      </label>

      <label className="field">
        <span className="field-label">{t('inputPanel.systemEfficiency')}</span>
        <input
          type="number"
          min={1}
          max={100}
          value={numericValue(inputs.systemEfficiencyPct)}
          onChange={e => update('systemEfficiencyPct', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderSystemEfficiency')}
        />
      </label>

      {inputs.systemEfficiencyPct > 85 && (
        <p className="field-hint field-hint--warning">
          {t('inputPanel.efficiencyWarning')}
        </p>
      )}

      <label className="field">
        <span className="field-label">{t('inputPanel.mountingFactor')}</span>
        <input
          type="number"
          min={1}
          max={3}
          step={0.1}
          value={numericValue(inputs.mountingFactor)}
          onChange={e => update('mountingFactor', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderMountingFactor')}
        />
      </label>

      {panelsNeeded > 0 && (
        <>
          <p className="field-hint">
            {t('inputPanel.calculatedCapacity', {
              value: solar.totalCapacityKw.toFixed(2),
            })}
          </p>
          <p className="field-hint">
            {t('inputPanel.calculatedPanels', { value: panelsNeeded })}
          </p>
          <p className="field-hint">
            {t('inputPanel.calculatedArea', { value: solar.panelAreaM2.toFixed(1) })}
          </p>
        </>
      )}
    </aside>
  )
}
