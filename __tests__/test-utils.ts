// Test utilities and helpers

export const mockGitHubContext = (overrides: any = {}) => {
  const defaultContext = {
    eventName: 'delete',
    payload: {
      ref_type: 'branch',
      ref: 'test-branch',
      repository: {
        name: 'test-repo',
      },
    },
  };
  
  return { ...defaultContext, ...overrides };
};

export const mockCoreInputs = (inputs: Record<string, string> = {}) => {
  const defaultInputs = {
    'access-token': 'test-token',
    'repo': 'test-repo',
    'branch': 'test-branch',
    'base-uri': 'https://app.launchdarkly.com',
  };
  
  return { ...defaultInputs, ...inputs };
};

export const createMockResponse = (status: number, body: any = '', headers: Record<string, string> = {}) => {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(headers),
    text: jest.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
    json: jest.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
  };
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
