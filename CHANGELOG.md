# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-19

### Added
- Initial release of LaunchDarkly Delete Branch GitHub Action
- Automatic branch deletion from LaunchDarkly Code References when GitHub branches are deleted
- Retry logic with exponential backoff for handling rate limits and transient errors
- Comprehensive error handling with detailed logging
- Configurable options for different environments
- Force delete option for manual branch cleanup workflows
- Support for custom repository keys and base URIs
- Built-in validation for required inputs and GitHub context

### Changed
- Updated workflow to auto-commit dist files on releases
- Fixed GitHub Action by adding dist files and build workflow

### Fixed
- Fixed linting issues
- Updated README with proper repository URL

## [Unreleased]

### Added
- Nothing yet

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet