import * as core from '@actions/core';
import * as github from '@actions/github';
import nock from 'nock';
import { deleteBranch, run } from '../src/index';

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

describe('run function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nock.cleanAll();
    
    // Reset environment
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.NODE_ENV;
    
    // Mock core.getInput
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'access-token': 'test-token',
        'repo': 'test-repo',
        'branch': 'test-branch',
        'base-uri': 'https://app.launchdarkly.com',
        'force': 'false'
      };
      return inputs[name] || '';
    });
    
    // Mock core.getBooleanInput
    (core.getBooleanInput as jest.Mock).mockImplementation((name: string) => {
      const inputs: Record<string, boolean> = {
        'force': false
      };
      return inputs[name] || false;
    });
    
    // Mock github context
    (github.context as any) = {
      eventName: 'delete',
      payload: {
        ref_type: 'branch',
        ref: 'test-branch',
        repository: {
          name: 'test-repo'
        }
      }
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should skip non-branch delete events by default', async () => {
    (github.context as any).payload.ref_type = 'tag';
    
    await run();
    
    expect(core.info).toHaveBeenCalledWith('Skipping non-branch delete event (ref_type=tag). Use force: true to override.');
    expect(core.setFailed).not.toHaveBeenCalled();
  });

  it('should proceed with non-branch delete events when force-delete is true', async () => {
    (github.context as any).payload.ref_type = 'tag';
    (core.getBooleanInput as jest.Mock).mockReturnValue(true);
    
    const scope = nock('https://app.launchdarkly.com')
      .post('/api/v2/code-refs/repositories/test-repo/branch-delete-tasks')
      .reply(200, { success: true });

    await run();
    
    expect(core.info).toHaveBeenCalledWith("Deleting LaunchDarkly Code Refs branch 'test-branch' in repo 'test-repo'...");
    expect(core.info).toHaveBeenCalledWith('✅ LaunchDarkly Code Refs branch delete queued successfully.');
    expect(scope.isDone()).toBe(true);
  });

  it('should proceed with branch delete events normally', async () => {
    (github.context as any).payload.ref_type = 'branch';
    
    const scope = nock('https://app.launchdarkly.com')
      .post('/api/v2/code-refs/repositories/test-repo/branch-delete-tasks')
      .reply(200, { success: true });

    await run();
    
    expect(core.info).toHaveBeenCalledWith("Deleting LaunchDarkly Code Refs branch 'test-branch' in repo 'test-repo'...");
    expect(core.info).toHaveBeenCalledWith('✅ LaunchDarkly Code Refs branch delete queued successfully.');
    expect(scope.isDone()).toBe(true);
  });

  it('should handle missing repository key', async () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'access-token': 'test-token',
        'branch': 'test-branch'
      };
      return inputs[name] || '';
    });
    
    (github.context as any).payload.repository = null;
    delete process.env.GITHUB_REPOSITORY;

    await run();
    
    expect(core.setFailed).toHaveBeenCalledWith('Action failed: Repository key not found');
  });

  it('should handle missing branch ref', async () => {
    (core.getInput as jest.Mock).mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        'access-token': 'test-token',
        'repo': 'test-repo'
      };
      return inputs[name] || '';
    });
    
    (github.context as any).payload.ref = null;

    await run();
    
    expect(core.setFailed).toHaveBeenCalledWith('Action failed: Branch ref not found');
  });
});