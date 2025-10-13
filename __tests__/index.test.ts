import { fetchWithRetry, deleteBranch } from '../src/index';
import * as core from '@actions/core';

// Mock the core module
jest.mock('@actions/core');

describe('fetchWithRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should succeed on first attempt', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const request = new Request('https://example.com');
    const response = await fetchWithRetry(request);

    expect(response).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 status', async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '1' }),
    };
    const mockResponse200 = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse429)
      .mockResolvedValueOnce(mockResponse200);

    const request = new Request('https://example.com');
    const logger = jest.fn();
    
    const response = await fetchWithRetry(request, { logger });

    expect(response).toBe(mockResponse200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('429'));
  });

  it('should retry on 5xx status', async () => {
    const mockResponse500 = {
      ok: false,
      status: 500,
      headers: new Headers(),
    };
    const mockResponse200 = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse500)
      .mockResolvedValueOnce(mockResponse200);

    const request = new Request('https://example.com');
    const logger = jest.fn();
    
    const response = await fetchWithRetry(request, { logger });

    expect(response).toBe(mockResponse200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('500'));
  });

  it('should retry on network errors', async () => {
    const mockResponse200 = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockResponse200);

    const request = new Request('https://example.com');
    const logger = jest.fn();
    
    const response = await fetchWithRetry(request, { logger });

    expect(response).toBe(mockResponse200);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('Network error'));
  });

  it('should fail after max retries', async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ 'Retry-After': '1' }),
    };

    (global.fetch as jest.Mock).mockResolvedValue(mockResponse429);

    const request = new Request('https://example.com');
    const logger = jest.fn();
    
    await expect(fetchWithRetry(request, { maxRetries: 2, logger }))
      .rejects.toThrow('Request failed after 2 retries');
    
    expect(global.fetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});

describe('deleteBranch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('should successfully delete a branch', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await deleteBranch('token123', 'my-repo', 'feature-branch');

    expect(result).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    
    const call = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(call.url).toBe('https://app.launchdarkly.com/api/v2/code-refs/repositories/my-repo/branch-delete-tasks');
    expect(call.method).toBe('POST');
    expect(call.headers.get('Authorization')).toBe('token123');
    expect(call.headers.get('Content-Type')).toBe('application/json');
    
    const body = await call.text();
    expect(JSON.parse(body)).toEqual(['feature-branch']);
  });

  it('should use custom base URI', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await deleteBranch('token123', 'my-repo', 'feature-branch', 'https://custom.ld.com');

    const call = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(call.url).toBe('https://custom.ld.com/api/v2/code-refs/repositories/my-repo/branch-delete-tasks');
  });

  it('should URL encode repository key', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue(''),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await deleteBranch('token123', 'my/repo', 'feature-branch');

    const call = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(call.url).toBe('https://app.launchdarkly.com/api/v2/code-refs/repositories/my%2Frepo/branch-delete-tasks');
  });

  it('should throw error on API failure', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      text: jest.fn().mockResolvedValue('Invalid repository'),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await expect(deleteBranch('token123', 'my-repo', 'feature-branch'))
      .rejects.toThrow('LD API error 400: Invalid repository');
  });

  it('should handle empty response text', async () => {
    const mockResponse = {
      ok: false,
      status: 400, // Use 400 which doesn't retry
      statusText: 'Bad Request',
      text: jest.fn().mockResolvedValue(''),
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);

    await expect(deleteBranch('token123', 'my-repo', 'feature-branch'))
      .rejects.toThrow('LD API error 400: Bad Request');
  });
});
