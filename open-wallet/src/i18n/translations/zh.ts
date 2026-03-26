/**
 * Chinese Simplified translations — 简体中文
 * Translated from en.ts
 *
 * Naming convention: screen.component.key
 * Keep strings short — they must fit on small phone screens.
 */

export default {
  // ─── Common ───
  common: {
    send: '发送',
    receive: '接收',
    swap: '兑换',
    bridge: '跨链',
    stake: '质押',
    history: '记录',
    cancel: '取消',
    confirm: '确认',
    copy: '复制',
    share: '分享',
    back: '返回',
    next: '下一步',
    done: '完成',
    error: '错误',
    success: '成功',
    loading: '加载中...',
  },

  // ─── Home ───
  home: {
    appName: 'Open Wallet',
    simpleTagline: '你的资产，你做主',
    proTagline: '通用 DeFi 终端',
    yourBalance: '余额',
    portfolioValue: '资产总值',
    tokens: '{{count}} 个代币',
    tokens_other: '{{count}} 个代币',
    chains: '链',
    networkStatus: '网络状态',
    backend: '后端',
    target: '目标',
    server: '服务器',
    mobileP2P: '移动端 P2P',
  },

  // ─── Onboarding ───
  onboarding: {
    title: 'Open Wallet',
    subtitle: '你的资产。你做主。\n所有代币。所有链。一个应用。',
    createWallet: '创建新钱包',
    restoreWallet: '恢复已有钱包',
    footer: '100% 开源 • 后量子加密',
    saveRecoveryPhrase: '保存助记词',
    saveWarning: '请按顺序抄写这 {{count}} 个单词。这是恢复钱包的唯一方式，切勿与他人分享。',
    iveSavedIt: '我已保存',
    restoreTitle: '恢复钱包',
    restoreHint: '输入你的 12 或 24 个助记词，以空格分隔。',
    enterRecoveryPhrase: '输入助记词...',
    setPassword: '设置密码',
    passwordHint: '此密码使用后量子抗性加密技术在本设备上加密你的钱包。',
    passwordPlaceholder: '密码（至少 8 位）',
    confirmPassword: '确认密码',
    createButton: '创建钱包',
    weakPassword: '密码至少需要 8 个字符。',
    passwordMismatch: '两次输入的密码不一致。',
    invalidPhrase: '请输入 12 或 24 个单词的助记词。',
  },

  // ─── Send ───
  send: {
    title: '发送',
    to: '收款方',
    recipientPlaceholder: '收款地址',
    amount: '金额',
    estimatedFee: '预估手续费',
    confirmTitle: '确认交易',
    confirmMessage: '发送 {{amount}} {{token}} 到 {{address}}？',
    sent: '交易已成功提交。',
    failed: '交易失败，请重试。',
    missingAddress: '请输入收款地址。',
    invalidAmount: '请输入有效金额。',
    invalidAddress: '这不是有效的 {{chain}} 地址。',
    irreversibleWarning: '发送前请仔细核对地址，交易一旦发出无法撤回。',
  },

  // ─── Receive ───
  receive: {
    title: '接收',
    scanToSend: '扫码发送 {{chain}}',
    yourAddress: '你的 {{chain}} 地址',
    tapToCopy: '点击复制 • 长按分享',
    copied: '地址已复制到剪贴板',
    wrongTokenWarning: '请仅向此地址发送 {{chain}} 及 {{chain}} 兼容代币。发送其他代币可能导致永久丢失。',
  },

  // ─── Swap ───
  swap: {
    title: '兑换',
    subtitle: '任意代币互换，一键完成',
    from: '从',
    to: '到',
    slippage: '滑点',
    route: '路由',
    priceImpact: '价格影响',
    bestRoute: '通过 DEX 聚合器的最优路由',
    popular: '热门',
    confirmTitle: '确认兑换',
    confirmMessage: '兑换 {{fromAmount}} {{fromToken}} → 约 {{toAmount}} {{toToken}}？',
    swapButton: '兑换 {{from}} → {{to}}',
    success: '兑换成功。',
    failed: '兑换失败，请重试。',
  },

  // ─── Mode ───
  mode: {
    pro: '专业',
    simple: '简洁',
  },
} as const;
