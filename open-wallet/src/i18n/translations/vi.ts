/**
 * Vietnamese translations — Tiếng Việt
 * Translated from en.ts
 *
 * Naming convention: screen.component.key
 * Keep strings short — they must fit on small phone screens.
 */

export default {
  // ─── Common ───
  common: {
    send: 'Gửi',
    receive: 'Nhận',
    swap: 'Hoán đổi',
    bridge: 'Bridge',
    stake: 'Stake',
    history: 'Lịch sử',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    copy: 'Sao chép',
    share: 'Chia sẻ',
    back: 'Quay lại',
    next: 'Tiếp',
    done: 'Xong',
    error: 'Lỗi',
    success: 'Thành công',
    loading: 'Đang tải...',
  },

  // ─── Home ───
  home: {
    appName: 'Open Wallet',
    simpleTagline: 'Tiền của bạn, bạn làm chủ',
    proTagline: 'Thiết bị đầu cuối DeFi đa năng',
    yourBalance: 'Số dư của bạn',
    portfolioValue: 'Giá trị danh mục',
    tokens: '{{count}} token',
    tokens_other: '{{count}} token',
    chains: 'Chuỗi',
    networkStatus: 'Trạng thái mạng',
    backend: 'Backend',
    target: 'Mục tiêu',
    server: 'Máy chủ',
    mobileP2P: 'P2P Di động',
  },

  // ─── Onboarding ───
  onboarding: {
    title: 'Open Wallet',
    subtitle: 'Tiền của bạn. Bạn làm chủ.\nMọi token. Mọi chuỗi. Một ứng dụng.',
    createWallet: 'Tạo ví mới',
    restoreWallet: 'Khôi phục ví hiện có',
    footer: '100% Mã nguồn mở • Mã hóa hậu lượng tử',
    saveRecoveryPhrase: 'Lưu cụm từ khôi phục',
    saveWarning: 'Hãy ghi lại {{count}} từ này theo đúng thứ tự. Đây là cách DUY NHẤT để khôi phục ví của bạn. Tuyệt đối không chia sẻ cho ai.',
    iveSavedIt: 'Tôi đã lưu',
    restoreTitle: 'Khôi phục ví của bạn',
    restoreHint: 'Nhập cụm từ khôi phục gồm 12 hoặc 24 từ, cách nhau bằng dấu cách.',
    enterRecoveryPhrase: 'Nhập cụm từ khôi phục...',
    setPassword: 'Đặt mật khẩu',
    passwordHint: 'Mật khẩu này mã hóa ví của bạn trên thiết bị này bằng công nghệ mã hóa kháng lượng tử.',
    passwordPlaceholder: 'Mật khẩu (8+ ký tự)',
    confirmPassword: 'Xác nhận mật khẩu',
    createButton: 'Tạo ví',
    weakPassword: 'Mật khẩu phải có ít nhất 8 ký tự.',
    passwordMismatch: 'Mật khẩu không khớp.',
    invalidPhrase: 'Vui lòng nhập cụm từ khôi phục gồm 12 hoặc 24 từ.',
  },

  // ─── Send ───
  send: {
    title: 'Gửi',
    to: 'Đến',
    recipientPlaceholder: 'Địa chỉ người nhận',
    amount: 'Số lượng',
    estimatedFee: 'Phí ước tính',
    confirmTitle: 'Xác nhận giao dịch',
    confirmMessage: 'Gửi {{amount}} {{token}} đến {{address}}?',
    sent: 'Giao dịch đã được gửi thành công.',
    failed: 'Giao dịch thất bại. Vui lòng thử lại.',
    missingAddress: 'Vui lòng nhập địa chỉ người nhận.',
    invalidAmount: 'Vui lòng nhập số lượng hợp lệ.',
    invalidAddress: 'Đây không phải là địa chỉ {{chain}} hợp lệ.',
    irreversibleWarning: 'Kiểm tra kỹ địa chỉ trước khi gửi. Giao dịch không thể hoàn tác.',
  },

  // ─── Receive ───
  receive: {
    title: 'Nhận',
    scanToSend: 'Quét để gửi {{chain}}',
    yourAddress: 'Địa chỉ {{chain}} của bạn',
    tapToCopy: 'Chạm để sao chép • Nhấn giữ để chia sẻ',
    copied: 'Đã sao chép địa chỉ vào bộ nhớ tạm',
    wrongTokenWarning: 'Chỉ gửi {{chain}} và các token tương thích với {{chain}} đến địa chỉ này. Gửi token khác có thể dẫn đến mất mát vĩnh viễn.',
  },

  // ─── Swap ───
  swap: {
    title: 'Hoán đổi',
    subtitle: 'Bất kỳ token nào, chỉ một chạm',
    from: 'Từ',
    to: 'Sang',
    slippage: 'Trượt giá',
    route: 'Tuyến',
    priceImpact: 'Ảnh hưởng giá',
    bestRoute: 'Tuyến tối ưu qua bộ tổng hợp DEX',
    popular: 'Phổ biến',
    confirmTitle: 'Xác nhận hoán đổi',
    confirmMessage: 'Hoán đổi {{fromAmount}} {{fromToken}} → ~{{toAmount}} {{toToken}}?',
    swapButton: 'Hoán đổi {{from}} → {{to}}',
    success: 'Hoán đổi thành công.',
    failed: 'Hoán đổi thất bại. Vui lòng thử lại.',
  },

  // ─── Mode ───
  mode: {
    pro: 'PRO',
    simple: 'CƠ BẢN',
  },
} as const;
