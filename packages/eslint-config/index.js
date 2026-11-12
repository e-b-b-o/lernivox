module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
    ],
    'no-console': ['warn', { allow: ['warn', 'error', 'info', 'log'] }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'coverage/',
    '*.d.ts',
  ],
};
