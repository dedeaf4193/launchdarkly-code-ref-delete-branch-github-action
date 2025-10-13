// Test setup file
import * as core from '@actions/core';
import * as github from '@actions/github';

// Mock the GitHub Actions modules
jest.mock('@actions/core');
jest.mock('@actions/github');

// Mock console methods to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn();

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
