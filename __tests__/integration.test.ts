import * as core from '@actions/core';
import * as github from '@actions/github';
import nock from 'nock';
import { deleteBranch } from '../src/index';

// Mock the modules
jest.mock('@actions/core');
jest.mock('@actions/github');

describe('GitHub Action Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    
    // Reset environment
    delete process.env.GITHUB_REPOSITORY;
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should successfully delete branch with proper inputs', async () => {
    // Mock the LaunchDarkly API
    const scope = nock('https://app.launchdarkly.com')
      .post('/api/v2/code-refs/repositories/test-repo/branch-delete-tasks')
      .matchHeader('authorization', 'test-token')
      .matchHeader('content-type', 'application/json')
      .reply(200, { success: true });

    await deleteBranch('test-token', 'test-repo', 'test-branch');

    expect(scope.isDone()).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    const scope = nock('https://app.launchdarkly.com')
      .post('/api/v2/code-refs/repositories/test-repo/branch-delete-tasks')
      .reply(400, 'Bad Request');

    await expect(deleteBranch('test-token', 'test-repo', 'test-branch'))
      .rejects.toThrow('LD API error 400: Bad Request');

    expect(scope.isDone()).toBe(true);
  });

  it('should use custom base URI', async () => {
    const scope = nock('https://custom.ld.com')
      .post('/api/v2/code-refs/repositories/test-repo/branch-delete-tasks')
      .reply(200, { success: true });

    await deleteBranch('test-token', 'test-repo', 'test-branch', 'https://custom.ld.com');

    expect(scope.isDone()).toBe(true);
  });

  it('should URL encode repository key', async () => {
    const scope = nock('https://app.launchdarkly.com')
      .post('/api/v2/code-refs/repositories/my%2Frepo/branch-delete-tasks')
      .reply(200, { success: true });

    await deleteBranch('test-token', 'my/repo', 'test-branch');

    expect(scope.isDone()).toBe(true);
  });
});