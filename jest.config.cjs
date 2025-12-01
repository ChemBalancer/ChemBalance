/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'], // .test.ts or .test.tsx inside __tests__
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  globals: {
    'ts-jest': { tsconfig: 'tsconfig.json' },
  },
};
