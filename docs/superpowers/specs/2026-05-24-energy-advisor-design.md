# Energy Advisor — Design Spec
**Date:** 2026-05-24  
**Project:** `C:\Users\lenovo\React-Projects\energy`  
**Stack:** React + Vite + TypeScript + Recharts + react-i18next

---

## 1. Purpose

A pure-frontend energy cost calculator that helps users compare three power sources — grid electricity, diesel generator, and solar — based on their device's power consumption. No backend, no login, works offline. Results appear live as the user types.

---

## 2. Architecture

**Pattern:** Calculation engine separated from UI (Approach B).

```
src/
├── utils/
│   └── energyCalculations.ts     ← pure functions, no React, no side effects
├── components/
│   ├── InputPanel.tsx             ← left column, all user inputs
│   ├── EnergySourceCard.tsx       ← reusable result card (rendered 3×)
│   ├── ComparisonChart.tsx        ← 5-year cost bar chart (Recharts)
│   └── RecommendationBanner.tsx   ← best-option summary sentence
├── pages/
│   └── Dashboard.tsx              ← assembles the full layout
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── en.json
│       ├── ar.json
│       └── fr.json
├── styles/
│   └── brand.css                  ← Alafdal brand tokens (imported once in main.tsx)
└── App.tsx
```

**Data flow:**
1. User types into `InputPanel` → updates local React state in `Dashboard`
2. `Dashboard` calls calculation functions from `energyCalculations.ts` on every state change
3. Computed results passed as props to `EnergySourceCard` × 3, `ComparisonChart`, `RecommendationBanner`
4. No `useEffect`, no async, no API calls — pure synchronous recalculation

---

## 3. Layout

Two-column dashboard at 1280px max-width:

```
┌─────────────────────────────────────────────────────────────────┐
│  Navbar: "⚡ EnergyAdvisor" — brand blue (#2E3192)              │
├──────────────────┬──────────────────────────────────────────────┤
│  INPUT PANEL     │  RESULTS AREA                                │
│  (280px fixed)   │                                              │
│                  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  Device Power    │  │⚡ Grid   │ │⛽ Generator│ │☀️ Solar      │ │
│  Phase Type      │  │          │ │          │ │  BEST VALUE  │ │
│  Daily Hours     │  │ $168/mo  │ │ $336/mo  │ │  $0/mo       │ │
│  ─────────────   │  └──────────┘ └──────────┘ └──────────────┘ │
│  kWh price       │                                              │
│  Diesel price    │  ┌──────────────────────────────────────────┐│
│  Solar budget    │  │ 5-Year Cost Comparison (bar chart)       ││
│                  │  └──────────────────────────────────────────┘│
│                  │                                              │
│                  │  ┌──────────────────────────────────────────┐│
│                  │  │ RecommendationBanner                     ││
│                  │  └──────────────────────────────────────────┘│
└──────────────────┴──────────────────────────────────────────────┘
```

- Input panel: fixed 280px, white background, scrollable on small screens
- Results area: fluid, updates live on every keystroke
- Mobile (< 768px): stack input above results, full width
- "BEST VALUE" badge on whichever card has lowest 5-year total cost

---

## 4. Inputs

| Field | Type | Default | Notes |
|---|---|---|---|
| Device Power | number (watts) | 0 | Positive integer |
| Phase Type | toggle: Single / 3-Phase | Single | Affects generator sizing |
| Daily Usage | number (hours) | 8 | 1–24 |
| Electricity price | number ($/kWh) | 0.10 | Local grid tariff |
| Diesel price | number ($/liter) | 0.80 | Local fuel price |
| Solar install budget | number ($) | 0 | Optional; used for payback calc |

All inputs use `type="number"` with `min` constraints. Results recalculate on `onChange`.

---

## 5. Calculation Engine (`energyCalculations.ts`)

All functions are pure (no side effects, no imports outside this file except types).

### 5.1 Shared

```ts
const kW = watts / 1000
const dailyEnergy = kW * hoursPerDay          // kWh/day
```

### 5.2 Electricity

```ts
monthlyCost = dailyEnergy * pricePerKwh * 30
annualCost  = dailyEnergy * pricePerKwh * 365
dailyKwh    = dailyEnergy
```

### 5.3 Generator

```ts
// Generator size — round up to next standard kVA
standardSizes = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]
requiredKva   = kW * 1.25                    // 25% overhead
generatorKva  = first standardSize >= requiredKva

// Fuel
fuelPerHour   = kW * 0.25                    // liters/hour (diesel standard)
dailyFuel     = fuelPerHour * hoursPerDay    // liters/day
monthlyFuel   = dailyFuel * 30
monthlyFuelCost = monthlyFuel * dieselPricePerLiter
annualFuelCost  = dailyFuel * 365 * dieselPricePerLiter
```

### 5.4 Solar

```ts
// Panels
panelsNeeded  = Math.ceil((watts * 1.2) / 400)   // 400W panels, 20% overhead

// Battery (50% Depth of Discharge, 90% inverter efficiency)
batteryKva    = Math.ceil((kW * hoursPerDay) / 0.5 / 0.9)

// Payback
annualSavings = annualElectricityCost            // vs grid baseline
paybackYears  = installBudget > 0
                  ? installBudget / annualSavings
                  : null

// 5-year amortized monthly cost
fiveYearCost  = installBudget
monthlyAmortized = installBudget / (5 * 12)     // for chart comparison
```

### 5.5 Recommendation

```ts
fiveYearTotals = {
  electricity: annualCost * 5,
  generator:   annualFuelCost * 5,
  solar:       installBudget > 0 ? installBudget : Infinity  // excluded when budget not entered
}
bestOption = key with lowest fiveYearTotal
// If all inputs are zero → no recommendation shown
```

When `installBudget === 0`: solar card shows "Enter install budget to compare" instead of payback, and solar is excluded from the best-value badge.

---

## 6. Components

### `InputPanel.tsx`
- Receives `inputs` state + `onChange` handler from Dashboard
- Two sections separated by a divider: "Device Details" and "Pricing"
- Phase type rendered as a two-button toggle (not a `<select>`)
- All labels use `t('key')` from react-i18next

### `EnergySourceCard.tsx`
Props: `source ('electricity'|'generator'|'solar')`, `results`, `isBestValue: boolean`

Displays:
- Source icon + name
- Monthly cost (large)
- 3–4 secondary metrics (e.g. liters/day for generator, panels count for solar)
- "BEST VALUE" badge when `isBestValue === true` (green border + badge)

### `ComparisonChart.tsx`
- Recharts `BarChart` with 3 bars: Grid / Generator / Solar (amortized)
- Colors: `#2E3192` / `#F59E0B` / `#0A823B`
- X-axis: source names (translated)
- Y-axis: cost in user's currency
- Tooltip shows exact 5-year total

### `RecommendationBanner.tsx`
- Renders a single sentence: *"Solar saves you $8,400 over 5 years compared to grid electricity."*
- Green background (`var(--color-state-success-bg)`) with green text
- Hidden when inputs are all zero

### `Dashboard.tsx`
- Owns all input state via `useState`
- Calls `calculateAll(inputs)` from `energyCalculations.ts` on every render
- Passes results as props to child components
- Grid layout: `grid-template-columns: 280px 1fr` on desktop, `1fr` on mobile

---

## 7. Styling

- Follows Alafdal Brand System from `CLAUDE.md §3`
- `brand.css` imported once in `main.tsx`
- All colors via CSS variables (`var(--brand-green)`, `var(--brand-blue)`, etc.)
- No hardcoded hex values in components
- Fonts: Cairo for Arabic, Inter for English/French
- RTL: `dir="rtl"` on `<html>` when Arabic is active; use `margin-inline-start` not `margin-left`

---

## 8. Internationalization

Three locales: `en`, `ar`, `fr`. All UI strings keyed in all three files before use.  
Language switcher in the navbar (flag + code: EN / AR / FR).  
Switching language also switches font family and text direction.

---

## 9. Out of Scope

- Photo upload / AI image recognition
- User accounts or saved history
- Backend / API
- Real-time electricity tariff lookup
- Region-specific solar irradiance data (peak sun hours fixed at 5h)

---

## 10. Dependencies

```json
{
  "recharts": "^2.x",
  "react-i18next": "^14.x",
  "i18next": "^23.x"
}
```

Vite + React + TypeScript scaffold assumed (`npm create vite@latest`).
