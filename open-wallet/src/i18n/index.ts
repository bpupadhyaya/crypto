/**
 * Internationalization — Planet-level language support.
 *
 * Uses i18next (industry standard, used by Airbnb, Microsoft, etc.)
 * + expo-localization (detects device language).
 *
 * Priority languages (matching Open Wallet's target users):
 *   1. English (en) — default
 *   2. Hindi (hi) — India
 *   3. Vietnamese (vi) — Vietnam
 *   4. Chinese Simplified (zh) — China
 *   5. Spanish (es) — Latin America, USA
 *   6. Swahili (sw) — East Africa
 *   7. Portuguese (pt) — Brazil
 *   8. French (fr) — West Africa, France
 *   9. Arabic (ar) — Middle East, North Africa
 *  10. Japanese (ja) — Japan
 *
 * Adding a language: create a new file in translations/, import it below.
 */

import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import en from './translations/en';
import hi from './translations/hi';
import es from './translations/es';
import zh from './translations/zh';
import vi from './translations/vi';
import ar from './translations/ar';
import pt from './translations/pt';
import fr from './translations/fr';
import ja from './translations/ja';
import ko from './translations/ko';

const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      es: { translation: es },
      zh: { translation: zh },
      vi: { translation: vi },
      ar: { translation: ar },
      pt: { translation: pt },
      fr: { translation: fr },
      ja: { translation: ja },
      ko: { translation: ko },
    },
    lng: deviceLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React Native handles escaping
    },
  });

export default i18next;
