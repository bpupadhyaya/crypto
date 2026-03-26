/**
 * Hindi translations — हिन्दी
 * Translated from en.ts
 *
 * Naming convention: screen.component.key
 * Keep strings short — they must fit on small phone screens.
 */

export default {
  // ─── Common ───
  common: {
    send: 'भेजें',
    receive: 'प्राप्त करें',
    swap: 'स्वैप',
    bridge: 'ब्रिज',
    stake: 'स्टेक',
    history: 'इतिहास',
    cancel: 'रद्द करें',
    confirm: 'पुष्टि करें',
    copy: 'कॉपी',
    share: 'शेयर',
    back: 'वापस',
    next: 'आगे',
    done: 'हो गया',
    error: 'त्रुटि',
    success: 'सफल',
    loading: 'लोड हो रहा है...',
  },

  // ─── Home ───
  home: {
    appName: 'Open Wallet',
    simpleTagline: 'आपका पैसा, आपका नियंत्रण',
    proTagline: 'यूनिवर्सल DeFi टर्मिनल',
    yourBalance: 'आपकी शेष राशि',
    portfolioValue: 'पोर्टफ़ोलियो मूल्य',
    tokens: '{{count}} टोकन',
    tokens_other: '{{count}} टोकन',
    chains: 'चेन',
    networkStatus: 'नेटवर्क स्थिति',
    backend: 'बैकएंड',
    target: 'लक्ष्य',
    server: 'सर्वर',
    mobileP2P: 'मोबाइल P2P',
  },

  // ─── Onboarding ───
  onboarding: {
    title: 'Open Wallet',
    subtitle: 'आपका पैसा। आपका नियंत्रण।\nहर टोकन। हर चेन। एक ऐप।',
    createWallet: 'नया वॉलेट बनाएँ',
    restoreWallet: 'मौजूदा वॉलेट पुनर्स्थापित करें',
    footer: '100% ओपन सोर्स • पोस्ट-क्वांटम एन्क्रिप्टेड',
    saveRecoveryPhrase: 'अपना रिकवरी फ़्रेज़ सहेजें',
    saveWarning: 'इन {{count}} शब्दों को क्रम में लिख लें। यह आपके वॉलेट को पुनर्प्राप्त करने का एकमात्र तरीका है। इसे कभी किसी से साझा न करें।',
    iveSavedIt: 'मैंने सहेज लिया',
    restoreTitle: 'अपना वॉलेट पुनर्स्थापित करें',
    restoreHint: 'अपना 12 या 24 शब्दों का रिकवरी फ़्रेज़ दर्ज करें, शब्दों को स्पेस से अलग करें।',
    enterRecoveryPhrase: 'रिकवरी फ़्रेज़ दर्ज करें...',
    setPassword: 'अपना पासवर्ड सेट करें',
    passwordHint: 'यह पासवर्ड आपके वॉलेट को इस डिवाइस पर पोस्ट-क्वांटम प्रतिरोधी एन्क्रिप्शन से सुरक्षित करता है।',
    passwordPlaceholder: 'पासवर्ड (8+ अक्षर)',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    createButton: 'वॉलेट बनाएँ',
    weakPassword: 'पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।',
    passwordMismatch: 'पासवर्ड मेल नहीं खाते।',
    invalidPhrase: 'कृपया 12 या 24 शब्दों का रिकवरी फ़्रेज़ दर्ज करें।',
  },

  // ─── Send ───
  send: {
    title: 'भेजें',
    to: 'प्राप्तकर्ता',
    recipientPlaceholder: 'प्राप्तकर्ता का पता',
    amount: 'राशि',
    estimatedFee: 'अनुमानित शुल्क',
    confirmTitle: 'लेनदेन की पुष्टि करें',
    confirmMessage: '{{amount}} {{token}} को {{address}} पर भेजें?',
    sent: 'लेनदेन सफलतापूर्वक सबमिट हो गया।',
    failed: 'लेनदेन विफल रहा। कृपया पुनः प्रयास करें।',
    missingAddress: 'कृपया प्राप्तकर्ता का पता दर्ज करें।',
    invalidAmount: 'कृपया एक मान्य राशि दर्ज करें।',
    invalidAddress: 'यह एक मान्य {{chain}} पता नहीं है।',
    irreversibleWarning: 'भेजने से पहले पता दोबारा जाँच लें। लेनदेन वापस नहीं किए जा सकते।',
  },

  // ─── Receive ───
  receive: {
    title: 'प्राप्त करें',
    scanToSend: '{{chain}} भेजने के लिए स्कैन करें',
    yourAddress: 'आपका {{chain}} पता',
    tapToCopy: 'कॉपी करने के लिए टैप करें • शेयर करने के लिए लंबा दबाएँ',
    copied: 'पता क्लिपबोर्ड पर कॉपी हो गया',
    wrongTokenWarning: 'इस पते पर केवल {{chain}} और {{chain}}-संगत टोकन भेजें। अन्य टोकन भेजने से स्थायी हानि हो सकती है।',
  },

  // ─── Swap ───
  swap: {
    title: 'स्वैप',
    subtitle: 'कोई भी टोकन से कोई भी टोकन, एक टैप में',
    from: 'से',
    to: 'में',
    slippage: 'स्लिपेज',
    route: 'रूट',
    priceImpact: 'मूल्य प्रभाव',
    bestRoute: 'DEX एग्रीगेटर द्वारा सर्वोत्तम रूट',
    popular: 'लोकप्रिय',
    confirmTitle: 'स्वैप की पुष्टि करें',
    confirmMessage: '{{fromAmount}} {{fromToken}} → ~{{toAmount}} {{toToken}} स्वैप करें?',
    swapButton: '{{from}} → {{to}} स्वैप करें',
    success: 'स्वैप सफलतापूर्वक पूरा हुआ।',
    failed: 'स्वैप विफल रहा। कृपया पुनः प्रयास करें।',
  },

  // ─── Mode ───
  mode: {
    pro: 'प्रो',
    simple: 'सरल',
  },
} as const;
