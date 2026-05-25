import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dashboard } from './pages/Dashboard'
import alafdalLogo from './assets/alafdal-logo.png'

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
        <span className="navbar__brand">
          <img src={alafdalLogo} alt="Alafdal" className="navbar__logo" />
          {t('appName')}
        </span>
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
