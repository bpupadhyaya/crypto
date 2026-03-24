module.exports = {
  extends: ['expo'],
  rules: {
    // Security-critical rules
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': 'off', // handled by TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
