import { createI18n } from 'vue-i18n'
import zh from './zh'
import zhTW from './zh-TW'
import en from './en'

function detectLocale() {
  const lang = navigator.language || navigator.userLanguage
  if (lang.startsWith('en')) return 'en'
  if (lang.startsWith('zh-TW') || lang.startsWith('zh-HK') || lang.startsWith('zh-MO')) return 'zh-TW'
  return 'zh'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'zh',
  messages: { zh, 'zh-TW': zhTW, en },
})

export default i18n
