module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'off'
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
    'coverage/**',
    '*.config.*',
    'src/**/*.ts'
  ]
}; 