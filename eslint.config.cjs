const tsParser = require('@typescript-eslint/parser');

module.exports = [
  { ignores: ['**/node_modules/**'] },
  {
    files: ['{apps,scripts,tests}/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
    rules: {
      'no-debugger': 'error',
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-unsafe-finally': 'error',
      'valid-typeof': 'error'
    }
  },
  {
    files: ['{apps,scripts,tests}/**/*.{js,jsx,cjs,mjs}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } }
  },
  {
    files: ['{apps,scripts,tests}/**/*.{ts,tsx,cts,mts}'],
    languageOptions: { parser: tsParser }
  }
];
