# LaunchDarkly Delete Branch Action

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A GitHub Action that automatically deletes branches from LaunchDarkly Code References when they are deleted in GitHub.

## Features

- 🚀 **Automatic branch deletion** - Deletes LaunchDarkly Code Refs branches when GitHub branches are deleted
- 🔄 **Retry logic** - Built-in retry mechanism for handling rate limits and transient errors
- ⚡ **Fast execution** - Optimized for quick branch cleanup
- 🛡️ **Error handling** - Comprehensive error handling with detailed logging
- 🔧 **Configurable** - Flexible configuration options for different environments

## Usage

### Basic Usage

```yaml
name: Delete LaunchDarkly Branch
on:
  delete:
    branches: [main, develop, feature/*]

jobs:
  delete-ld-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Delete LaunchDarkly Code Refs Branch
        uses: launchdarkly-labs/launchdarkly-code-ref-delete-branch-github-action@v1
        with:
          access-token: ${{ secrets.LAUNCHDARKLY_ACCESS_TOKEN }}
```

### Advanced Usage

```yaml
name: Delete LaunchDarkly Branch
on:
  delete:
    branches: [main, develop, feature/*]

jobs:
  delete-ld-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Delete LaunchDarkly Code Refs Branch
        uses: launchdarkly-labs/launchdarkly-code-ref-delete-branch-github-action@v1
        with:
          access-token: ${{ secrets.LAUNCHDARKLY_ACCESS_TOKEN }}
          repo: my-custom-repo-key
          branch: ${{ github.ref_name }}
          base-uri: https://app.launchdarkly.com
```

### Force Delete Option

The `force` option allows you to delete LaunchDarkly branches even when the GitHub event is not a branch delete event:

```yaml
name: Force Delete LaunchDarkly Branch
on:
  workflow_dispatch:
    inputs:
      branch_name:
        description: 'Branch name to delete'
        required: true

jobs:
  force-delete-ld-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Force Delete LaunchDarkly Code Refs Branch
        uses: launchdarkly-labs/launchdarkly-code-ref-delete-branch-github-action@v1
        with:
          access-token: ${{ secrets.LAUNCHDARKLY_ACCESS_TOKEN }}
          branch: ${{ inputs.branch_name }}
          force: true
```

**When to use `force: true`:**
- Manual branch cleanup workflows
- Deleting branches triggered by tag deletions
- Cleanup scripts that run on schedule
- Any scenario where you need to delete a LaunchDarkly branch outside of a GitHub branch delete event

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `access-token` | LaunchDarkly API access token with Code References permissions | ✅ | - |
| `repo` | Repository key in LaunchDarkly | ❌ | GitHub repository name |
| `branch` | Branch name to delete | ❌ | Deleted branch from GitHub event |
| `base-uri` | LaunchDarkly base URI | ❌ | `https://app.launchdarkly.com` |
| `force` | Force delete even when not triggered by a branch delete event | ❌ | `false` |

## Setup

### 1. Create a LaunchDarkly Access Token

1. Go to your LaunchDarkly dashboard
2. Navigate to Account Settings > Access Tokens
3. Create a new token with Code References permissions
4. Copy the token value

### 2. Add the Token to GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `LAUNCHDARKLY_ACCESS_TOKEN`
5. Value: Your LaunchDarkly access token

### 3. Create the Workflow

Create a `.github/workflows/delete-ld-branch.yml` file in your repository:

```yaml
name: Delete LaunchDarkly Branch
on:
  delete:
    branches: [main, develop, feature/*]

jobs:
  delete-ld-branch:
    runs-on: ubuntu-latest
    steps:
      - name: Delete LaunchDarkly Code Refs Branch
        uses: launchdarkly-labs/launchdarkly-code-ref-delete-branch-github-action@v1
        with:
          access-token: ${{ secrets.LAUNCHDARKLY_ACCESS_TOKEN }}
```

## How It Works

1. **Trigger**: The action is triggered when a branch is deleted in GitHub
2. **Detection**: It automatically detects the deleted branch name and repository
3. **API Call**: Makes a POST request to LaunchDarkly's Code References API
4. **Retry Logic**: Implements exponential backoff for rate limits and transient errors
5. **Confirmation**: Logs success or failure of the operation

## Error Handling

The action includes comprehensive error handling:

- **Rate Limiting**: Automatically retries with exponential backoff when hitting rate limits
- **Transient Errors**: Retries on 5xx server errors
- **Network Issues**: Handles network timeouts and connection errors
- **Validation**: Validates required inputs and GitHub context

## Retry Logic

The action implements intelligent retry logic:

- **Max Retries**: 5 attempts by default
- **Base Delay**: 1 second initial delay
- **Exponential Backoff**: Doubles delay on each retry
- **Rate Limit Headers**: Respects `Retry-After` and `X-Ratelimit-Reset` headers
- **Transient Errors**: Only retries on 429 and 5xx status codes

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Package for distribution (REQUIRED before publishing)
npm run package
```

**Important**: The `dist/index.js` file must be created before the action can be used. This is done by running `npm run package`. The GitHub workflow will automatically build and package the action on releases.

### Scripts

- `npm run build` - Compile TypeScript
- `npm run package` - Package for distribution using @vercel/ncc
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## License

Apache 2.0 - see [LICENSE](LICENSE) file for details.

## LaunchDarkly Labs Disclaimer

This repository is maintained by LaunchDarkly Labs. While we try to keep it 
up to date, it is not officially supported by LaunchDarkly. For officially 
supported SDKs and tools, visit https://launchdarkly.com

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:

1. Check the [Issues](https://github.com/launchdarkly-labs/launchdarkly-code-ref-delete-branch-github-action/issues) page
2. Create a new issue with detailed information
3. Include logs and error messages when possible