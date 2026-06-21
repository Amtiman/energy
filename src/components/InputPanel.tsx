import { useTranslation } from 'react-i18next'
import type { EnergyInputs } from '../utils/energyCalculations'

interface Props {
  inputs: EnergyInputs
  onChange: (inputs: EnergyInputs) => void
}

export function InputPanel({ inputs, onChange }: Props) {
  const { t } = useTranslation()

  function update<K extends keyof EnergyInputs>(key: K, value: EnergyInputs[K]) {
    onChange({ ...inputs, [key]: value })
  }

  function numericValue(val: number) {
    return val === 0 ? '' : String(val)
  }

  // Auto-size the array to the device's peak load, rounded up to whole panels.
  const panelsNeeded =
    inputs.watts > 0 && inputs.solarPanelWatts > 0
      ? Math.ceil(inputs.watts / inputs.solarPanelWatts)
      : 0

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
        <span className="field-label">{t('inputPanel.solarBudget')}</span>
        <input
          type="number"
          min={0}
          value={numericValue(inputs.solarBudget)}
          onChange={e => update('solarBudget', Number(e.target.value))}
          className="field-input"
          placeholder={t('inputPanel.placeholderSolar')}
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

      {inputs.watts > 0 && inputs.solarPanelWatts > 0 && (
        <>
          <p className="field-hint">
            {t('inputPanel.calculatedCapacity', {
              value: ((panelsNeeded * inputs.solarPanelWatts) / 1000).toFixed(2),
            })}
          </p>
          <p className="field-hint">
            {t('inputPanel.calculatedPanels', { value: panelsNeeded })}
          </p>
        </>
      )}
    </aside>
  )
}
