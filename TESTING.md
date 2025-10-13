# Testing Guide

This GitHub Action can be tested in several ways:

## 1. Unit Tests

Run the comprehensive test suite:

```bash
npm test
```

This runs:
- **Unit tests** for `fetchWithRetry` and `deleteBranch` functions
- **Integration tests** with mocked API calls
- **Error handling tests** for various failure scenarios

### Test Coverage

```bash
npm run test:coverage
```

This generates a coverage report showing which parts of the code are tested.

### Watch Mode

```bash
npm run test:watch
```

Runs tests in watch mode, re-running when files change.

## 2. Manual Testing

Test the action against a real LaunchDarkly instance:

```bash
# Set your LaunchDarkly credentials
export LAUNCHDARKLY_TOKEN="your-api-token"
export LAUNCHDARKLY_REPO="your-repo-key"
export LAUNCHDARKLY_BRANCH="branch-to-delete"

# Run the manual test
npm run test:manual
```

## 3. GitHub Actions Testing

### Local Testing with act

Install [act](https://github.com/nektos/act) to run GitHub Actions locally:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test the action locally
act -j delete-branch --secret GITHUB_TOKEN=your-token
```

### Workflow Testing

Create a test workflow in `.github/workflows/test.yml`:

```yaml
name: Test Branch Delete Action

on:
  push:
    branches: [ test-branch ]
  delete:
    branches: [ test-branch ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Delete LaunchDarkly Branch
        uses: ./  # Use local action
        with:
          access-token: ${{ secrets.LAUNCHDARKLY_TOKEN }}
          repo: ${{ github.repository }}
          branch: ${{ github.ref_name }}
          force: true  # Optional: force delete even on non-branch events
```

## 4. API Testing

Test the LaunchDarkly API directly:

```bash
curl -X POST https://app.launchdarkly.com/api/v2/code-refs/repositories/your-repo/branch-delete-tasks \
     -H "Authorization: your-token" \
     -H "Content-Type: application/json" \
     -d '["branch-to-delete"]'
```

## 5. Force Option

The `force` option allows you to delete LaunchDarkly branches even when the GitHub event is not a branch delete event:

- **Default behavior**: Only runs on branch delete events (`ref_type: "branch"`)
- **With `force: true`**: Runs on any delete event (tags, branches, etc.)
- **Use case**: Useful for cleanup workflows or manual branch deletion

Example:
```yaml
- name: Force Delete Branch
  uses: ./ 
  with:
    access-token: ${{ secrets.LAUNCHDARKLY_TOKEN }}
    branch: "feature-branch"
    force: true
```

## 6. Test Scenarios

The test suite covers:

### ✅ Success Cases
- Successful branch deletion
- Custom base URI handling
- URL encoding of repository keys
- Retry logic for rate limits

### ❌ Error Cases
- API errors (400, 500)
- Network failures
- Missing inputs
- Invalid responses

### 🔄 Retry Logic
- Rate limiting (429 responses)
- Server errors (5xx responses)
- Network timeouts
- Exponential backoff

## 7. Debugging

### Enable Debug Logging

Set the `ACTIONS_STEP_DEBUG` environment variable:

```bash
export ACTIONS_STEP_DEBUG=true
npm run test:manual
```

### Check API Responses

The action logs detailed information about:
- Request URLs
- Response status codes
- Error messages
- Retry attempts

## 8. Continuous Integration

The action includes:
- **Linting** with ESLint
- **Formatting** with Prettier
- **Type checking** with TypeScript
- **Testing** with Jest
- **Build verification** with NCC

Run all checks:

```bash
npm run lint
npm run format
npm run build
npm test
npm run package
```
