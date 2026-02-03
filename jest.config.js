module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  baseUrl: '.',
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@middlewares/(.*)$': '<rootDir>/src/middlewares/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@resilience/(.*)$': '<rootDir>/src/resilience/$1',
    '^@observability/(.*)$': '<rootDir>/src/observability/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
