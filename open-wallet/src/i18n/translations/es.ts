/**
 * Spanish translations — Español
 * Translated from en.ts
 *
 * Naming convention: screen.component.key
 * Keep strings short — they must fit on small phone screens.
 */

export default {
  // ─── Common ───
  common: {
    send: 'Enviar',
    receive: 'Recibir',
    swap: 'Intercambiar',
    bridge: 'Bridge',
    stake: 'Stake',
    history: 'Historial',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    copy: 'Copiar',
    share: 'Compartir',
    back: 'Atrás',
    next: 'Siguiente',
    done: 'Listo',
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
  },

  // ─── Home ───
  home: {
    appName: 'Open Wallet',
    simpleTagline: 'Tu dinero, tu control',
    proTagline: 'Terminal DeFi Universal',
    yourBalance: 'Tu saldo',
    portfolioValue: 'Valor del portafolio',
    tokens: '{{count}} token',
    tokens_other: '{{count}} tokens',
    chains: 'Cadenas',
    networkStatus: 'Estado de la red',
    backend: 'Backend',
    target: 'Destino',
    server: 'Servidor',
    mobileP2P: 'P2P Móvil',
  },

  // ─── Onboarding ───
  onboarding: {
    title: 'Open Wallet',
    subtitle: 'Tu dinero. Tu control.\nCada token. Cada cadena. Una app.',
    createWallet: 'Crear nueva billetera',
    restoreWallet: 'Restaurar billetera existente',
    footer: '100% Código Abierto • Cifrado Post-Cuántico',
    saveRecoveryPhrase: 'Guarda tu frase de recuperación',
    saveWarning: 'Escribe estas {{count}} palabras en orden. Esta es la ÚNICA forma de recuperar tu billetera. Nunca la compartas.',
    iveSavedIt: 'Ya la guardé',
    restoreTitle: 'Restaura tu billetera',
    restoreHint: 'Ingresa tu frase de recuperación de 12 o 24 palabras, separadas por espacios.',
    enterRecoveryPhrase: 'Ingresa la frase de recuperación...',
    setPassword: 'Establece tu contraseña',
    passwordHint: 'Esta contraseña cifra tu billetera en este dispositivo con cifrado resistente a computación cuántica.',
    passwordPlaceholder: 'Contraseña (8+ caracteres)',
    confirmPassword: 'Confirmar contraseña',
    createButton: 'Crear billetera',
    weakPassword: 'La contraseña debe tener al menos 8 caracteres.',
    passwordMismatch: 'Las contraseñas no coinciden.',
    invalidPhrase: 'Ingresa una frase de recuperación de 12 o 24 palabras.',
  },

  // ─── Send ───
  send: {
    title: 'Enviar',
    to: 'Para',
    recipientPlaceholder: 'Dirección del destinatario',
    amount: 'Cantidad',
    estimatedFee: 'Comisión estimada',
    confirmTitle: 'Confirmar transacción',
    confirmMessage: '¿Enviar {{amount}} {{token}} a {{address}}?',
    sent: 'Transacción enviada con éxito.',
    failed: 'La transacción falló. Inténtalo de nuevo.',
    missingAddress: 'Ingresa la dirección del destinatario.',
    invalidAmount: 'Ingresa una cantidad válida.',
    invalidAddress: 'Esta no es una dirección {{chain}} válida.',
    irreversibleWarning: 'Verifica la dirección antes de enviar. Las transacciones no se pueden revertir.',
  },

  // ─── Receive ───
  receive: {
    title: 'Recibir',
    scanToSend: 'Escanea para enviar {{chain}}',
    yourAddress: 'Tu dirección {{chain}}',
    tapToCopy: 'Toca para copiar • Mantén presionado para compartir',
    copied: 'Dirección copiada al portapapeles',
    wrongTokenWarning: 'Envía solo {{chain}} y tokens compatibles con {{chain}} a esta dirección. Enviar otros tokens puede causar una pérdida permanente.',
  },

  // ─── Swap ───
  swap: {
    title: 'Intercambiar',
    subtitle: 'Cualquier token a cualquier token, un solo toque',
    from: 'De',
    to: 'A',
    slippage: 'Deslizamiento',
    route: 'Ruta',
    priceImpact: 'Impacto en el precio',
    bestRoute: 'Mejor ruta vía agregador DEX',
    popular: 'Popular',
    confirmTitle: 'Confirmar intercambio',
    confirmMessage: '¿Intercambiar {{fromAmount}} {{fromToken}} → ~{{toAmount}} {{toToken}}?',
    swapButton: 'Intercambiar {{from}} → {{to}}',
    success: 'Intercambio realizado con éxito.',
    failed: 'El intercambio falló. Inténtalo de nuevo.',
  },

  // ─── Mode ───
  mode: {
    pro: 'PRO',
    simple: 'SIMPLE',
  },
} as const;
