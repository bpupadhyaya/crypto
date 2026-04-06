/**
 * Wallet Safety Information — displayed in Settings > About > Wallet Safety
 * and used for in-app help/FAQ.
 */

export const WALLET_SAFETY_FAQ = [
  {
    question: 'What happens when I update Open Wallet from the App Store / Play Store?',
    answer:
      'Your wallet, seed phrase, PIN, and all settings are PRESERVED. ' +
      'App updates only replace the app code — your encrypted vault data stays intact. ' +
      'You do NOT need to re-enter your seed phrase or set up your wallet again. ' +
      'Just update and unlock with your PIN or biometrics as usual.',
  },
  {
    question: 'What happens if I uninstall and reinstall Open Wallet?',
    answer:
      'WARNING: Uninstalling the app DELETES all wallet data permanently. ' +
      'Your seed phrase, PIN, settings, and transaction history will be lost. ' +
      'You MUST have your 24-word recovery phrase written down to restore your wallet. ' +
      'If you lost your recovery phrase, your funds are UNRECOVERABLE.\n\n' +
      'To reinstall safely:\n' +
      '1. Make sure you have your recovery phrase written on paper\n' +
      '2. Uninstall the app\n' +
      '3. Install from App Store / Play Store\n' +
      '4. Tap "Restore Existing Wallet"\n' +
      '5. Enter your 24-word recovery phrase\n' +
      '6. Set a new password and PIN',
  },
  {
    question: 'Is my wallet safe during phone updates (iOS/Android)?',
    answer:
      'Yes. Operating system updates do NOT affect your wallet data. ' +
      'Your encrypted vault is stored in the device\'s secure keychain, ' +
      'which persists across OS updates.',
  },
  {
    question: 'What if my phone is lost or stolen?',
    answer:
      'Your wallet is protected by:\n' +
      '• PIN (6 digits, locked after 5 failed attempts)\n' +
      '• Biometrics (Face ID / Fingerprint)\n' +
      '• AES-256-GCM encryption with Argon2id key derivation\n' +
      '• Auto-lock after 5 minutes of inactivity\n\n' +
      'To recover on a new phone:\n' +
      '1. Install Open Wallet on the new phone\n' +
      '2. Tap "Restore Existing Wallet"\n' +
      '3. Enter your 24-word recovery phrase\n\n' +
      'Consider using "Emergency Wipe" remotely if your phone is stolen ' +
      '(requires Find My Phone / Google Find My Device).',
  },
  {
    question: 'What should I NEVER do?',
    answer:
      '• NEVER share your 24-word recovery phrase with anyone\n' +
      '• NEVER screenshot your recovery phrase\n' +
      '• NEVER store your recovery phrase digitally (no photos, no cloud, no notes app)\n' +
      '• NEVER uninstall the app without your recovery phrase written down\n' +
      '• NEVER clear app data / cache manually in phone settings',
  },
  {
    question: 'How do I back up my wallet?',
    answer:
      'Your 24-word recovery phrase IS your backup. As long as you have it ' +
      'written on paper and stored safely, you can restore your wallet on any device.\n\n' +
      'Go to Settings > Account & Security > Backup Verification to verify ' +
      'your recovery phrase is correct.',
  },
];

export const UPDATE_GUIDE = {
  title: 'Updating Open Wallet',
  safe: [
    'Update from App Store / Play Store — wallet data preserved',
    'Update your phone\'s operating system — wallet data preserved',
    'Change your PIN in Settings — old PIN replaced, wallet preserved',
    'Enable/disable biometrics — wallet preserved',
  ],
  dangerous: [
    'Uninstall the app — ALL wallet data deleted permanently',
    'Clear app data in phone Settings — ALL wallet data deleted',
    'Factory reset your phone — ALL wallet data deleted',
    'Lose your recovery phrase — funds UNRECOVERABLE',
  ],
};
