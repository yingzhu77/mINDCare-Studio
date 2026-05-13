import { createI18n } from 'vue-i18n'
import zh from './zh'
import en from './en'

function detectLocale() {
  const lang = navigator.language || navigator.userLanguage
  if (lang.startsWith('en')) return 'en'
  return 'zh'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh',
  messages: { zh, en },
})

export default i18n
