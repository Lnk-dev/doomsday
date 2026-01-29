# Load Testing Suite

This directory contains k6 load tests for the Doomsday application.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Running Tests

### Smoke Test (Basic Health Check)
```bash
k6 run tests/load/api-test.js --vus 1 --duration 30s
```

### Average Load Test
```bash
k6 run tests/load/api-test.js
```

### Stress Test
```bash
k6 run tests/load/api-test.js -e LOAD_PROFILE=stress
```

### WebSocket Test
```bash
k6 run tests/load/websocket-test.js
```

### Authenticated Endpoints Test
```bash
k6 run tests/load/authenticated-test.js
```

## Configuration

Set environment variables to configure the tests:
```bash
# API URL (default: http://localhost:3001)
export API_URL=https://api.doomsday.app

# WebSocket URL (default: ws://localhost:3001)
export WS_URL=wss://api.doomsday.app
```

## Test Profiles

| Profile | VUs | Duration | Purpose |
|---------|-----|----------|---------|
| Smoke | 1 | 30s | Verify basic functionality |
| Average | 50 | 9m | Normal daily traffic |
| Stress | 100-300 | 30m | Find breaking point |
| Spike | 10-500 | 6m | Sudden traffic surge |
| Soak | 100 | 40m | Memory leaks, stability |

## Thresholds

Tests will fail if any threshold is exceeded:
- 95th percentile response time > 500ms
- 99th percentile response time > 1000ms
- Error rate > 1%
- WebSocket error rate > 5%

## Output

### Console Summary
```
k6 run tests/load/api-test.js
```

### JSON Report
```bash
k6 run tests/load/api-test.js --out json=results.json
```

### InfluxDB/Grafana
```bash
k6 run tests/load/api-test.js --out influxdb=http://localhost:8086/k6
```

## CI Integration

Add to your CI pipeline:
```yaml
- name: Run Load Tests
  run: |
    k6 run tests/load/api-test.js --vus 10 --duration 30s
  continue-on-error: false
```

## Adding New Tests

1. Create a new `.js` file in this directory
2. Import shared config: `import { BASE_URL, THRESHOLDS } from './config.js'`
3. Define `options` with stages/thresholds
4. Export a default function with test logic
5. Use `group()` to organize related checks
6. Add custom metrics with `Rate` and `Trend`
