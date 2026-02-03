module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
    es2020: true,
  },
  globals: {
    Express: 'readonly',
    NodeJS: 'readonly',
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/', 'src/tests/', 'src/types/'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-console': 'off',
    'no-undef': 'off',
  },
};
