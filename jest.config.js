/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/lib/mcp/**/*.ts',
    '!src/lib/mcp/**/*.test.ts',
    '!src/lib/mcp/types.ts',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000, // MCP servers can be slow to start
};

module.exports = config;
