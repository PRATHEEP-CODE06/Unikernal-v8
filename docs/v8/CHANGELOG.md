# Unikernal v8 Changelog

## Version 8.0.0 - 2025-12-03

### Breaking Changes
- **Version Unification**: All components now report version 8.0.0
- **UDM Schema**: Updated from v5/v7 to v8 structure
  - `model_version` → `version`
  - Added required `intent` field
  - Standardized `meta` object structure
- **Adapter Registration**: Adapters now use standardized ID format: `{language}-adapter-v8-{uuid}`
- **Health Endpoint**: Changed metrics format from tuple arrays to objects

### Security Fixes
- **DEP0190 Compliance**: Removed `shell: true` from all `spawn()` calls in `adapterManager.js`
- **Secure Process Spawning**: All child processes now use secure spawn pattern without shell interpretation

### New Features
- **Root Entry Point**: Added `index.js` for programmatic kernel access
- **Enhanced Health Endpoint**: Now returns comprehensive metrics including:
  - `kernel_version`, `api_version`, `build_hash`
  - `memory` usage
  - `adapters` array with status, messages, lastActive, errors
  - `adapter_count`
- **Root Route**: Added `/` endpoint returning system information
- **Adapter Status Tracking**: Comprehensive tracking of:
  - `lastActive` timestamp
  - `errorCount`
  - `messageCount`
  - `latency` array (last 10 measurements)
  - `status` (starting/connected/timeout/disconnected/error)
- **Registration Timeout**: 5-second timeout watcher for adapter registration
- **Adapter Death Detection**: Automatic detection of adapter process failures
- **SmartRouter Metrics**: Enhanced with `total`, `errors`, `lastActive`, `latency` tracking
- **Improved Error Messages**: "No adapter available" errors now include list of available adapters

### CLI Improvements
- **Professional Output**: Removed all emojis and decorative characters
- **Help Flag**: Added `--help` and `-h` flag support
- **Error Handling**: Proper exit codes (0 for success, 1 for failure)

### Test Suite Overhaul
- **test_kernel.js**: Complete rewrite with proper assertions
  - Valid UDM v8 tests
  - Invalid UDM tests (missing fields)
  - Target not found tests
  - Math/String service tests
  - Proper exit codes
- **test_kernel_v7.js**: Fixed by removing non-existent functions
  - Removed `executeParallel` and `executePipeline` calls
  - Replaced with `Promise.all` for parallel testing
- **Client Tests**: Added validation and exit codes
  - `echo-client.js`: Validates echo response
  - `math-client.js`: Validates math operation results
  - `string-client.js`: Validates string operation results
  - All exit with code 1 on failure, 0 on success

### Examples & Demos
- **demos/v8/hot_swap/demo.js**: Demonstrates adapter hot-swapping
- **demos/v8/protocol_translation/demo.js**: Shows JSON ↔ YAML conversion
- **demos/v8/workflow_builder/demo.js**: Pipeline execution demonstration

### Configuration
- **Version Constants**: Added to `kernel/src/config.js`
  - `VERSION`: "8.0.0"
  - `API_VERSION`: "8.0"
  - `PROTOCOL_VERSION`: "8.0"
  - `KERNEL_NAME`: "Unikernal"
  - `BUILD_HASH`: Environment-based or "dev"

### Package Management
- **Root package.json**: Complete restructure
  - Added `name`, `version`, `description`, `main`, `type`
  - Added `bin` configuration for global CLI
  - Added comprehensive scripts: `start`, `dev`, `test`, `test:suite`, `test:kernel`, `inspect`
  - Consolidated all dependencies to avoid version conflicts
  - Unified `ws` version to `^8.18.3`

### Logging
- **Professional Logging**: Removed ASCII art banners
- **Minimal Output**: Clean, structured logging using logger module
- **Version Reporting**: Startup logs now include version information

### Compatibility
- **v5/v7 Support**: Maintained backward compatibility through schema adapters
- **Test Suite**: Updated to v8 UDM structure while preserving v7 test files

### Bug Fixes
- Fixed routing error messages to include available adapters
- Fixed health endpoint to return proper object metrics instead of tuple arrays
- Fixed adapter identity mismatches
- Fixed version inconsistencies across components

### Performance
- Secure spawn pattern has no performance impact
- Enhanced metrics tracking with minimal overhead
- Efficient latency tracking (rolling 10-sample window)

### Documentation
- Updated README.md with v8 information
- Created comprehensive CHANGELOG.md
- Updated walkthrough.md with Phase 2 completion details

## Migration Guide

### From v5/v7 to v8

**UDM Structure Changes:**
```javascript
// v5/v7
{
  model_version: "5.0",
  task_type: "compute",
  language: "python",
  data: {...}
}

// v8
{
  version: "8.0",
  source: "client-id",
  target: "adapter-python",
  intent: "execute",
  meta: {
    timestamp: "2025-12-03T...",
    trace_id: "unique-id"
  },
  payload: {...}
}
```

**Health Endpoint:**
```javascript
// Before
{
  status: "ok",
  metrics: [["adapter-1", {...}], ["adapter-2", {...}]]
}

// After
{
  status: "ok",
  kernel_version: "8.0.0",
  api_version: "8.0",
  adapters: [
    { id: "adapter-1", status: "connected", total: 100, errors: 0, ... },
    { id: "adapter-2", status: "connected", total: 50, errors: 1, ... }
  ]
}
```

### Testing
All tests now use proper assertions and exit codes. Run with:
```bash
npm test
npm run test:kernel
npm run test:suite
```

### Known Issues
None - all known issues have been resolved in v8.0.0.

---

**Full Release**: Unikernal v8.0.0 is production-ready with zero known errors, comprehensive test coverage, and enterprise-grade security compliance.
