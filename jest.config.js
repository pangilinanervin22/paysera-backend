/** @type {import('ts-jest').JestConfigWithTsJest} **/

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globalSetup: './src/test/jest.global-setup.ts',
  globalTeardown: './src/test/jest.global-teardown.ts',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.json',
    },
  },
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ]
};
