# Energy Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure-frontend React dashboard that compares grid electricity, diesel generator, and solar energy costs for a user-specified device, with live recalculation and a 5-year comparison chart.

**Architecture:** Calculation engine (`energyCalculations.ts`) holds all pure math functions with no React dependencies. A single `Dashboard` page owns all input state and passes computed results as props to display components. No backend, no routing, no user accounts.

**Tech Stack:** React 18 + Vite + TypeScript, Recharts (charts), react-i18next (EN/AR/FR), CSS variables from Alafdal brand system.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `package.json` / `vite.config.ts` / `tsconfig.json` | Create | Project scaffold |
| `index.html` | Create | HTML entry point |
| `src/main.tsx` | Create | React root mount |
| `src/App.tsx` | Create | Navbar + language switcher + RTL |
| `src/styles/brand.css` | Create | Alafdal CSS variables (import once) |
| `src/styles/app.css` | Create | Component layout styles |
| `src/i18n/index.ts` | Create | i18next init |
| `src/i18n/locales/en.json` | Create | English strings |
| `src/i18n/locales/ar.json` | Create | Arabic strings |
| `src/i18n/locales/fr.json` | Create | French strings |
| `src/utils/energyCalculations.ts` | Create | All calculation functions + types |
| `src/utils/energyCalculations.test.ts` | Create | Unit tests for calculations |
| `src/components/InputPanel.tsx` | Create | Left column user inputs |
| `src/components/EnergySourceCard.tsx` | Create | Reusable result card (rendered 3×) |
| `src/components/ComparisonChart.tsx` | Create | Recharts 5-year bar chart |
| `src/components/RecommendationBanner.tsx` | Create | Best-option summary sentence |
| `src/pages/Dashboard.tsx` | Create | Assembles all components |

---

## Task 1: Scaffold Vite + React + TypeScript project

**Files:**
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`

- [ ] **Step 1: Initialize project in the existing directory**

```bash
cd C:\Users\lenovo\React-Projects\energy
npm create vite@latest . -- --template react-ts
```

When prompted about existing files, choose to ignore/overwrite (the only existing content is `.claude/`).

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install recharts react-i18next i18next
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install -D vitest jsdom @vitest/ui
```

- [ ] **Step 4: Update `vite.config.ts` to add Vitest**

Replace the generated `vite.config.ts` with:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
```

- [ ] **Step 5: Add test script to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Delete Vite boilerplate files**

```bash
rm src/App.css src/App.tsx src/assets/react.svg public/vite.svg
```

(These will be replaced by our own files in later tasks.)

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts on `http://localhost:5173` (may show an error about missing App — that's fine at this stage).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json index.html
git commit -m "chore: scaffold vite react-ts project with vitest"
```

---

## Task 2: Brand CSS + app layout styles

**Files:**
- Create: `src/styles/brand.css`
- Create: `src/styles/app.css`

- [ ] **Step 1: Create `src/styles/brand.css`**

```css
/* Alafdal brand tokens — import once in main.tsx */

/* ── Raw Palette ── */
:root {
  --brand-green:        #0A823B;
  --brand-green-hover:  #06612D;
  --brand-blue:         #2E3192;
  --brand-blue-light:   #4A5FBD;
  --brand-blue-sky:     #E8ECFF;
  --brand-blue-dark:    #1A1E5C;
  --brand-blue-muted:   #A0A8D8;
  --brand-blue-bright:  #3D4DCC;
  --brand-red:          #DC2626;
  --brand-amber:        #F59E0B;

  /* Fonts */
  --font-arabic: 'Cairo', 'Tahoma', 'Segoe UI', system-ui, sans-serif;
  --font-latin:  'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Spacing (8px base) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Radius */
  --radius-xs:   4px;
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-card:  0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
  --shadow-focus: 0 0 0 3px rgba(46,49,146,0.25);

  /* ── Semantic Text ── */
  --color-text-heading: var(--brand-blue);
  --color-text-body:    var(--brand-blue-dark);
  --color-text-muted:   var(--brand-blue-muted);
  --color-text-inverse: #FFFFFF;
  --color-text-link:    var(--brand-blue-bright);
  --color-text-error:   var(--brand-red);
  --color-text-success: var(--brand-green);
  --color-text-warning: var(--brand-amber);

  /* ── Backgrounds ── */
  --color-bg-page:     #FFFFFF;
  --color-bg-subtle:   var(--brand-blue-sky);
  --color-card-bg:     #FDFDFD;
  --color-card-border: var(--brand-blue-muted);

  /* ── Buttons ── */
  --color-btn-primary-bg:       var(--brand-green);
  --color-btn-primary-bg-hover: var(--brand-green-hover);
  --color-btn-primary-text:     #FFFFFF;
  --color-btn-secondary-border: var(--brand-blue);
  --color-btn-secondary-text:   var(--brand-blue);

  /* ── Inputs ── */
  --color-input-border:       var(--brand-blue-muted);
  --color-input-border-focus: var(--brand-blue);
  --color-input-border-error: var(--brand-red);
  --color-label-text:         var(--brand-blue-dark);

  /* ── State: success ── */
  --color-state-success-bg:     rgba(10,130,59,0.08);
  --color-state-success-text:   var(--brand-green);
  --color-state-success-border: var(--brand-green);

  /* ── State: warning ── */
  --color-state-warning-bg:     rgba(245,158,11,0.10);
  --color-state-warning-text:   var(--brand-amber);
  --color-state-warning-border: var(--brand-amber);

  /* ── State: error ── */
  --color-state-error-bg:     rgba(220,38,38,0.08);
  --color-state-error-text:   var(--brand-red);
  --color-state-error-border: var(--brand-red);

  /* ── State: info ── */
  --color-state-info-bg:     var(--brand-blue-sky);
  --color-state-info-text:   var(--brand-blue);
  --color-state-info-border: var(--brand-blue-muted);
}

/* Dark mode overrides */
.dark {
  --color-bg-page:     #0f172a;
  --color-bg-subtle:   #1e293b;
  --color-card-bg:     #1e293b;
  --color-card-border: #334155;
}

/* Base */
*,
*::before,
*::after { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg-page);
  color: var(--color-text-body);
  font-family: var(--font-latin);
}

html[lang="ar"] body {
  font-family: var(--font-arabic);
}
```

- [ ] **Step 2: Create `src/styles/app.css`**

```css
/* Component layout styles — uses brand.css variables */

/* ── Navbar ── */
.navbar {
  background: var(--brand-blue);
  color: white;
  padding: 12px var(--space-6);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  position: sticky;
  top: 0;
  z-index: 10;
}
.navbar__brand {
  font-weight: 700;
  font-size: 1.125rem;
  white-space: nowrap;
}
.navbar__tagline {
  flex: 1;
  font-size: 0.875rem;
  opacity: 0.7;
}
.lang-switcher { display: flex; gap: var(--space-1); }
.lang-btn {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.4);
  color: white;
  border-radius: var(--radius-xs);
  padding: 4px 8px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: background 0.15s;
}
.lang-btn:hover { background: rgba(255,255,255,0.15); }
.lang-btn--active {
  background: rgba(255,255,255,0.25);
  border-color: white;
  font-weight: 600;
}

/* ── Dashboard grid ── */
.dashboard {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: calc(100vh - 49px);
  max-width: 1280px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .dashboard { grid-template-columns: 1fr; }
}

/* ── Input Panel ── */
.input-panel {
  background: white;
  border-inline-end: 1px solid var(--color-card-border);
  padding: var(--space-6);
  overflow-y: auto;
}
.section-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand-blue);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 var(--space-4) 0;
}
.field {
  display: block;
  margin-bottom: var(--space-4);
}
.field-label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-1);
  font-weight: 500;
}
.field-input {
  width: 100%;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  font-size: 0.875rem;
  color: var(--color-text-body);
  background: var(--color-bg-subtle);
}
.field-input:focus {
  outline: none;
  border-color: var(--color-input-border-focus);
  box-shadow: var(--shadow-focus);
}
.phase-toggle { display: flex; gap: var(--space-1); }
.phase-btn {
  flex: 1;
  padding: 6px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.15s;
}
.phase-btn.active {
  background: var(--brand-blue);
  color: white;
  border-color: var(--brand-blue);
  font-weight: 600;
}
.divider {
  border: none;
  border-top: 1px dashed var(--color-card-border);
  margin: var(--space-4) 0;
}

/* ── Results area ── */
.dashboard__results {
  padding: var(--space-6);
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}
@media (max-width: 900px) {
  .cards-row { grid-template-columns: 1fr; }
}

/* ── Energy Source Card ── */
.energy-card {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  position: relative;
  box-shadow: var(--shadow-card);
}
.energy-card--best { border: 2px solid var(--brand-green); }
.best-badge {
  position: absolute;
  top: -10px;
  inset-inline-end: var(--space-3);
  background: var(--brand-green);
  color: white;
  font-size: 0.625rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 700;
  letter-spacing: 0.05em;
}
.energy-card__header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}
.energy-card__icon { font-size: 1.125rem; }
.energy-card__name {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-text-heading);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.energy-card__cost {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--color-text-body);
  line-height: 1;
}
.energy-card__unit {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: var(--space-3);
}
.energy-card__meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
.energy-card__meta--highlight {
  color: var(--brand-green);
  font-weight: 600;
  margin-top: var(--space-2);
}

/* ── Comparison Chart ── */
.comparison-chart {
  background: var(--color-card-bg);
  border: 1px solid var(--color-card-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
}
.comparison-chart__title {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--color-text-body);
  margin: 0 0 var(--space-4) 0;
}
.comparison-chart__note {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: var(--space-2) 0 0 0;
}

/* ── Recommendation Banner ── */
.recommendation-banner {
  background: var(--color-state-success-bg);
  border: 1px solid var(--color-state-success-border);
  color: var(--color-state-success-text);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-6);
  font-size: 0.9375rem;
  font-weight: 500;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/
git commit -m "feat: add Alafdal brand CSS variables and app layout styles"
```

---

## Task 3: i18n setup — EN / AR / FR

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/locales/en.json`
- Create: `src/i18n/locales/ar.json`
- Create: `src/i18n/locales/fr.json`

- [ ] **Step 1: Create `src/i18n/locales/en.json`**

```json
{
  "appName": "EnergyAdvisor",
  "tagline": "Smart Energy Cost Calculator",
  "inputPanel": {
    "title": "Device Details",
    "devicePower": "Device Power (Watts)",
    "phaseType": "Phase Type",
    "singlePhase": "Single Phase",
    "threePhase": "3-Phase",
    "dailyHours": "Daily Usage (Hours)",
    "pricing": "Pricing",
    "electricityPrice": "Electricity Price (per kWh)",
    "dieselPrice": "Diesel Price (per Liter)",
    "solarBudget": "Solar Install Budget (optional, $)"
  },
  "sources": {
    "electricity": "Grid Electricity",
    "generator": "Generator",
    "solar": "Solar"
  },
  "metrics": {
    "perMonth": "per month",
    "annualCost": "Annual: {{value}}",
    "dailyKwh": "Daily: {{value}} kWh",
    "litersPerDay": "{{value}} liters / day",
    "sizeNeeded": "Generator size: {{value}} kVA",
    "panelsCount": "Panels: {{count}} × 400W",
    "batterySize": "Battery: {{value}} kVA",
    "payback": "Payback: ~{{value}} years",
    "enterBudget": "Enter install budget to compare"
  },
  "bestValue": "BEST VALUE",
  "chart": {
    "title": "5-Year Cost Comparison",
    "note": "Solar bar shows total installation cost (amortized over 5 years)"
  },
  "recommendation": {
    "solar": "Solar saves you {{savings}} over 5 years compared to grid electricity.",
    "electricity": "Grid electricity is the most cost-effective option for your usage.",
    "generator": "A generator is the most cost-effective option for your usage."
  }
}
```

- [ ] **Step 2: Create `src/i18n/locales/ar.json`**

```json
{
  "appName": "مستشار الطاقة",
  "tagline": "حاسبة تكاليف الطاقة الذكية",
  "inputPanel": {
    "title": "تفاصيل الجهاز",
    "devicePower": "قدرة الجهاز (واط)",
    "phaseType": "نوع الطور",
    "singlePhase": "أحادي الطور",
    "threePhase": "ثلاثي الطور",
    "dailyHours": "ساعات الاستخدام اليومي",
    "pricing": "الأسعار",
    "electricityPrice": "سعر الكهرباء (لكل كيلوواط·ساعة)",
    "dieselPrice": "سعر الديزل (للتر)",
    "solarBudget": "ميزانية تركيب الطاقة الشمسية (اختياري، $)"
  },
  "sources": {
    "electricity": "الكهرباء",
    "generator": "المولد الكهربائي",
    "solar": "الطاقة الشمسية"
  },
  "metrics": {
    "perMonth": "شهرياً",
    "annualCost": "سنوياً: {{value}}",
    "dailyKwh": "يومياً: {{value}} كيلوواط·ساعة",
    "litersPerDay": "{{value}} لتر / يوم",
    "sizeNeeded": "حجم المولد: {{value}} كيلو فولت أمبير",
    "panelsCount": "الألواح: {{count}} × 400 واط",
    "batterySize": "البطارية: {{value}} كيلو فولت أمبير",
    "payback": "فترة الاسترداد: ~{{value}} سنوات",
    "enterBudget": "أدخل ميزانية التركيب للمقارنة"
  },
  "bestValue": "الأفضل قيمة",
  "chart": {
    "title": "مقارنة التكاليف لمدة 5 سنوات",
    "note": "يعكس عمود الطاقة الشمسية إجمالي تكلفة التركيب (مُستهلَكة على 5 سنوات)"
  },
  "recommendation": {
    "solar": "الطاقة الشمسية توفر لك {{savings}} خلال 5 سنوات مقارنةً بالكهرباء.",
    "electricity": "الكهرباء هي الخيار الأوفر تكلفةً لاستهلاكك.",
    "generator": "المولد الكهربائي هو الخيار الأوفر تكلفةً لاستهلاكك."
  }
}
```

- [ ] **Step 3: Create `src/i18n/locales/fr.json`**

```json
{
  "appName": "ConseillerÉnergie",
  "tagline": "Calculateur de coûts d'énergie intelligent",
  "inputPanel": {
    "title": "Détails de l'appareil",
    "devicePower": "Puissance de l'appareil (Watts)",
    "phaseType": "Type de phase",
    "singlePhase": "Monophasé",
    "threePhase": "Triphasé",
    "dailyHours": "Utilisation quotidienne (heures)",
    "pricing": "Tarification",
    "electricityPrice": "Prix de l'électricité (par kWh)",
    "dieselPrice": "Prix du diesel (par litre)",
    "solarBudget": "Budget installation solaire (optionnel, $)"
  },
  "sources": {
    "electricity": "Électricité réseau",
    "generator": "Groupe électrogène",
    "solar": "Solaire"
  },
  "metrics": {
    "perMonth": "par mois",
    "annualCost": "Annuel : {{value}}",
    "dailyKwh": "Quotidien : {{value}} kWh",
    "litersPerDay": "{{value}} litres / jour",
    "sizeNeeded": "Taille groupe : {{value}} kVA",
    "panelsCount": "Panneaux : {{count}} × 400W",
    "batterySize": "Batterie : {{value}} kVA",
    "payback": "Remboursement : ~{{value}} ans",
    "enterBudget": "Entrez le budget d'installation pour comparer"
  },
  "bestValue": "MEILLEUR CHOIX",
  "chart": {
    "title": "Comparaison des coûts sur 5 ans",
    "note": "La barre solaire représente le coût total d'installation (amorti sur 5 ans)"
  },
  "recommendation": {
    "solar": "Le solaire vous fait économiser {{savings}} sur 5 ans par rapport au réseau.",
    "electricity": "L'électricité réseau est l'option la plus rentable pour votre usage.",
    "generator": "Le groupe électrogène est l'option la plus rentable pour votre usage."
  }
}
```

- [ ] **Step 4: Create `src/i18n/index.ts`**

```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import ar from './locales/ar.json'
import fr from './locales/fr.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
```

- [ ] **Step 5: Commit**

```bash
git add src/i18n/
git commit -m "feat: add i18n setup with EN, AR, FR locales"
```

---

## Task 4: Calculation engine — types + electricity (TDD)

**Files:**
- Create: `src/utils/energyCalculations.ts`
- Create: `src/utils/energyCalculations.test.ts`

- [ ] **Step 1: Write the failing test for electricity**

Create `src/utils/energyCalculations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { calculateElectricity } from './energyCalculations'

const BASE = {
  watts: 1000,
  phase: 'single' as const,
  hoursPerDay: 10,
  pricePerKwh: 0.10,
  dieselPrice: 1.00,
  solarBudget: 0,
}

describe('calculateElectricity', () => {
  it('returns zero values when watts is 0', () => {
    const r = calculateElectricity({ ...BASE, watts: 0 })
    expect(r.dailyKwh).toBe(0)
    expect(r.monthlyCost).toBe(0)
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
```

- [ ] **Step 2: Run test — verify it fails**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: FAIL — `Cannot find module './energyCalculations'`

- [ ] **Step 3: Create `src/utils/energyCalculations.ts` with types + electricity**

```ts
// ── Types ──────────────────────────────────────────────────────────

export interface EnergyInputs {
  watts: number
  phase: 'single' | 'three'
  hoursPerDay: number
  pricePerKwh: number
  dieselPrice: number
  solarBudget: number
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
  batteryKva: number
  monthlyAmortized: number
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
  if (inputs.watts === 0) return { dailyKwh: 0, monthlyCost: 0, annualCost: 0 }
  const kW = inputs.watts / 1000
  const dailyKwh = kW * inputs.hoursPerDay
  return {
    dailyKwh,
    monthlyCost: dailyKwh * inputs.pricePerKwh * 30,
    annualCost: dailyKwh * inputs.pricePerKwh * 365,
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add EnergyInputs types and calculateElectricity"
```

---

## Task 5: Calculation engine — generator (TDD)

**Files:**
- Modify: `src/utils/energyCalculations.ts` (add generator function)
- Modify: `src/utils/energyCalculations.test.ts` (add generator tests)

- [ ] **Step 1: Add failing generator tests**

First, update the import line at the top of `src/utils/energyCalculations.test.ts`:

```ts
import { calculateElectricity, calculateGenerator } from './energyCalculations'
```

Then append the following `describe` block at the bottom of the file (after the existing electricity tests):

```ts
describe('calculateGenerator', () => {
  it('returns zero values when watts is 0', () => {
    const r = calculateGenerator({ ...BASE, watts: 0 })
    expect(r.generatorKva).toBe(0)
    expect(r.dailyFuel).toBe(0)
  })

  it('rounds up to next standard kVA size', () => {
    // 1kW × 1.25 = 1.25 kVA → next standard = 5 kVA
    const r = calculateGenerator(BASE)
    expect(r.generatorKva).toBe(5)
  })

  it('selects 10 kVA for a 7kW device', () => {
    // 7kW × 1.25 = 8.75 kVA → next standard = 10 kVA
    const r = calculateGenerator({ ...BASE, watts: 7000 })
    expect(r.generatorKva).toBe(10)
  })

  it('calculates fuel consumption correctly', () => {
    // 1kW × 0.25 = 0.25 L/h; × 10h = 2.5 L/day; × 30 × $1 = $75/month
    const r = calculateGenerator(BASE)
    expect(r.fuelPerHour).toBeCloseTo(0.25)
    expect(r.dailyFuel).toBeCloseTo(2.5)
    expect(r.monthlyFuelCost).toBeCloseTo(75)
    expect(r.annualFuelCost).toBeCloseTo(912.5)
  })
})
```

- [ ] **Step 2: Run — verify new tests fail**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: existing 4 pass, new 4 FAIL with `calculateGenerator is not a function`

- [ ] **Step 3: Implement `calculateGenerator` in `energyCalculations.ts`**

Add after `calculateElectricity`:

```ts
const STANDARD_KVA = [5, 7.5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100]

export function calculateGenerator(inputs: EnergyInputs): GeneratorResult {
  if (inputs.watts === 0) {
    return { generatorKva: 0, fuelPerHour: 0, dailyFuel: 0, monthlyFuelCost: 0, annualFuelCost: 0 }
  }
  const kW = inputs.watts / 1000
  const requiredKva = kW * 1.25
  const generatorKva = STANDARD_KVA.find(s => s >= requiredKva) ?? STANDARD_KVA[STANDARD_KVA.length - 1]
  const fuelPerHour = kW * 0.25
  const dailyFuel = fuelPerHour * inputs.hoursPerDay
  return {
    generatorKva,
    fuelPerHour,
    dailyFuel,
    monthlyFuelCost: dailyFuel * 30 * inputs.dieselPrice,
    annualFuelCost: dailyFuel * 365 * inputs.dieselPrice,
  }
}
```

- [ ] **Step 4: Run — verify all tests pass**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: add calculateGenerator with standard kVA rounding"
```

---

## Task 6: Calculation engine — solar + recommendation + calculateAll (TDD)

**Files:**
- Modify: `src/utils/energyCalculations.ts`
- Modify: `src/utils/energyCalculations.test.ts`

- [ ] **Step 1: Add failing solar + recommendation tests**

First, update the import line at the top of `src/utils/energyCalculations.test.ts`:

```ts
import {
  calculateElectricity,
  calculateGenerator,
  calculateSolar,
  calculateRecommendation,
  calculateAll,
} from './energyCalculations'
```

Then append the following `describe` blocks at the bottom of the file (after the existing generator tests):

```ts
describe('calculateSolar', () => {
  it('returns zero values when watts is 0', () => {
    const elec = calculateElectricity({ ...BASE, watts: 0 })
    const r = calculateSolar({ ...BASE, watts: 0 }, elec)
    expect(r.panelsNeeded).toBe(0)
    expect(r.batteryKva).toBe(0)
  })

  it('calculates panels needed with 20% overhead', () => {
    // 1000W × 1.2 / 400W = 3 panels
    const elec = calculateElectricity(BASE)
    const r = calculateSolar(BASE, elec)
    expect(r.panelsNeeded).toBe(3)
  })

  it('calculates battery size with 50% DoD and 90% efficiency', () => {
    // 1kW × 10h = 10 kWh; / 0.5 / 0.9 = 22.2 → ceil = 23 kVA
    const elec = calculateElectricity(BASE)
    const r = calculateSolar(BASE, elec)
    expect(r.batteryKva).toBe(23)
  })

  it('returns null payback when solarBudget is 0', () => {
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarBudget: 0 }, elec)
    expect(r.paybackYears).toBeNull()
    expect(r.monthlyAmortized).toBe(0)
  })

  it('calculates payback when budget is provided', () => {
    // annualSavings = $365; budget = $730 → payback = 2 years
    const elec = calculateElectricity(BASE)
    const r = calculateSolar({ ...BASE, solarBudget: 730 }, elec)
    expect(r.paybackYears).toBe(2)
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
```

- [ ] **Step 2: Run — verify new tests fail**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: 8 existing PASS, new ones FAIL.

- [ ] **Step 3: Implement solar + recommendation + calculateAll in `energyCalculations.ts`**

Append to `energyCalculations.ts`:

```ts
export function calculateSolar(inputs: EnergyInputs, electricity: ElectricityResult): SolarResult {
  if (inputs.watts === 0) {
    return { panelsNeeded: 0, batteryKva: 0, monthlyAmortized: 0, paybackYears: null, annualSavings: 0 }
  }
  const kW = inputs.watts / 1000
  const panelsNeeded = Math.ceil((inputs.watts * 1.2) / 400)
  const batteryKva = Math.ceil((kW * inputs.hoursPerDay) / 0.5 / 0.9)
  const monthlyAmortized = inputs.solarBudget > 0 ? inputs.solarBudget / 60 : 0
  const annualSavings = electricity.annualCost
  const paybackYears =
    inputs.solarBudget > 0 && annualSavings > 0
      ? parseFloat((inputs.solarBudget / annualSavings).toFixed(1))
      : null
  return { panelsNeeded, batteryKva, monthlyAmortized, paybackYears, annualSavings }
}

export function calculateRecommendation(
  inputs: EnergyInputs,
  electricity: ElectricityResult,
  generator: GeneratorResult,
  solar: SolarResult
): RecommendationResult {
  if (inputs.watts === 0) {
    return {
      bestOption: null,
      fiveYearTotals: { electricity: 0, generator: 0, solar: 0 },
      savingsAmount: 0,
      savingsVs: null,
    }
  }

  const raw = {
    electricity: electricity.annualCost * 5,
    generator: generator.annualFuelCost * 5,
    solar: inputs.solarBudget > 0 ? inputs.solarBudget : Infinity,
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

export function calculateAll(inputs: EnergyInputs): AllResults {
  const electricity = calculateElectricity(inputs)
  const generator = calculateGenerator(inputs)
  const solar = calculateSolar(inputs, electricity)
  const recommendation = calculateRecommendation(inputs, electricity, generator, solar)
  return { electricity, generator, solar, recommendation }
}
```

- [ ] **Step 4: Run all tests — verify everything passes**

```bash
npx vitest run src/utils/energyCalculations.test.ts
```

Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/
git commit -m "feat: complete calculation engine — solar, recommendation, calculateAll"
```

---

## Task 7: InputPanel component

**Files:**
- Create: `src/components/InputPanel.tsx`

- [ ] **Step 1: Create `src/components/InputPanel.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { EnergyInputs } from '../utils/energyCalculations'

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
          placeholder="e.g. 7000"
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
          placeholder="e.g. 8"
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
          placeholder="e.g. 0.10"
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
          placeholder="e.g. 0.80"
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
          placeholder="e.g. 8000"
        />
      </label>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/InputPanel.tsx
git commit -m "feat: add InputPanel component"
```

---

## Task 8: EnergySourceCard component

**Files:**
- Create: `src/components/EnergySourceCard.tsx`

- [ ] **Step 1: Create `src/components/EnergySourceCard.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import {
  ElectricityResult,
  GeneratorResult,
  SolarResult,
} from '../utils/energyCalculations'

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
          <div className="energy-card__cost">${fmt(electricity.monthlyCost)}</div>
          <div className="energy-card__unit">{t('metrics.perMonth')}</div>
          <div className="energy-card__meta">
            {t('metrics.annualCost', { value: `$${fmt(electricity.annualCost)}` })}
          </div>
          <div className="energy-card__meta">
            {t('metrics.dailyKwh', { value: fmt(electricity.dailyKwh) })}
          </div>
        </>
      )}

      {source === 'generator' && generator && (
        <>
          <div className="energy-card__cost">${fmt(generator.monthlyFuelCost)}</div>
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
          <div className="energy-card__cost">${fmt(solar.monthlyAmortized)}</div>
          <div className="energy-card__unit">{t('metrics.perMonth')}</div>
          <div className="energy-card__meta">
            {t('metrics.panelsCount', { count: solar.panelsNeeded })}
          </div>
          <div className="energy-card__meta">
            {t('metrics.batterySize', { value: solar.batteryKva })}
          </div>
          <div className={`energy-card__meta${solar.paybackYears !== null ? ' energy-card__meta--highlight' : ''}`}>
            {solar.paybackYears !== null
              ? t('metrics.payback', { value: solar.paybackYears })
              : t('metrics.enterBudget')}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/EnergySourceCard.tsx
git commit -m "feat: add EnergySourceCard component"
```

---

## Task 9: ComparisonChart component

**Files:**
- Create: `src/components/ComparisonChart.tsx`

- [ ] **Step 1: Create `src/components/ComparisonChart.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { RecommendationResult } from '../utils/energyCalculations'

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
      fill: '#2E3192',
    },
    {
      name: t('sources.generator'),
      cost: recommendation.fiveYearTotals.generator,
      fill: '#F59E0B',
    },
    ...(hasSolarBudget
      ? [
          {
            name: t('sources.solar'),
            cost: recommendation.fiveYearTotals.solar,
            fill: '#0A823B',
          },
        ]
      : []),
  ]

  return (
    <div className="comparison-chart">
      <h3 className="comparison-chart__title">{t('chart.title')}</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={v => `$${Number(v).toLocaleString()}`}
            width={70}
          />
          <Tooltip
            formatter={(value: number) => [
              `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
              t('chart.title'),
            ]}
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ComparisonChart.tsx
git commit -m "feat: add ComparisonChart with Recharts bar chart"
```

---

## Task 10: RecommendationBanner component

**Files:**
- Create: `src/components/RecommendationBanner.tsx`

- [ ] **Step 1: Create `src/components/RecommendationBanner.tsx`**

```tsx
import { useTranslation } from 'react-i18next'
import { RecommendationResult } from '../utils/energyCalculations'

interface Props {
  recommendation: RecommendationResult
}

export function RecommendationBanner({ recommendation }: Props) {
  const { t } = useTranslation()

  if (!recommendation.bestOption) return null

  const savings = recommendation.savingsAmount.toLocaleString(undefined, {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'USD',
  })

  return (
    <div className="recommendation-banner">
      {t(`recommendation.${recommendation.bestOption}`, { savings })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/RecommendationBanner.tsx
git commit -m "feat: add RecommendationBanner component"
```

---

## Task 11: Dashboard page + App.tsx + main.tsx wiring

**Files:**
- Create: `src/pages/Dashboard.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step 1: Create `src/pages/Dashboard.tsx`**

```tsx
import { useState } from 'react'
import { EnergyInputs, calculateAll } from '../utils/energyCalculations'
import { InputPanel } from '../components/InputPanel'
import { EnergySourceCard } from '../components/EnergySourceCard'
import { ComparisonChart } from '../components/ComparisonChart'
import { RecommendationBanner } from '../components/RecommendationBanner'

const DEFAULT_INPUTS: EnergyInputs = {
  watts: 0,
  phase: 'single',
  hoursPerDay: 8,
  pricePerKwh: 0.1,
  dieselPrice: 0.8,
  solarBudget: 0,
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

        <RecommendationBanner recommendation={results.recommendation} />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/App.tsx`**

```tsx
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dashboard } from './pages/Dashboard'

const LANGUAGES = ['en', 'ar', 'fr'] as const

export function App() {
  const { i18n, t } = useTranslation()

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <>
      <nav className="navbar">
        <span className="navbar__brand">⚡ {t('appName')}</span>
        <span className="navbar__tagline">{t('tagline')}</span>
        <div className="lang-switcher">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => i18n.changeLanguage(lang)}
              className={`lang-btn${i18n.language === lang ? ' lang-btn--active' : ''}`}
              aria-pressed={i18n.language === lang ? 'true' : 'false'}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <Dashboard />
    </>
  )
}
```

- [ ] **Step 3: Create `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './styles/brand.css'
import './styles/app.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 4: Run all tests one final time**

```bash
npx vitest run
```

Expected: all tests PASS

- [ ] **Step 5: Start dev server and verify the app**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- Dashboard renders with input panel on the left and 3 empty cards on the right
- Typing `7000` in Device Power updates all 3 cards live
- Switching language to AR flips to RTL layout and Arabic text
- Entering a Solar Budget shows the payback period and adds solar to the chart
- The "BEST VALUE" badge appears on the cheapest option

- [ ] **Step 6: Final commit**

```bash
git add src/
git commit -m "feat: wire up Dashboard, App, and main — energy advisor complete"
```
