/**
 * Load Testing Configuration
 *
 * Common configuration for all load tests.
 */

export const BASE_URL = __ENV.API_URL || 'http://localhost:3001'
export const WS_URL = __ENV.WS_URL || 'ws://localhost:3001'

// Test user credentials (should be seeded in test environment)
export const TEST_USERS = [
  { username: 'loadtest1', email: 'loadtest1@test.com' },
  { username: 'loadtest2', email: 'loadtest2@test.com' },
  { username: 'loadtest3', email: 'loadtest3@test.com' },
]

// Thresholds for pass/fail criteria
export const THRESHOLDS = {
  // HTTP request duration
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95th < 500ms, 99th < 1s

  // HTTP request failure rate
  http_req_failed: ['rate<0.01'], // Less than 1% failures

  // Custom metrics
  'http_req_duration{name:posts_feed}': ['p(95)<300'],
  'http_req_duration{name:create_post}': ['p(95)<500'],
  'http_req_duration{name:place_bet}': ['p(95)<500'],
}

// Load profiles for different scenarios
export const LOAD_PROFILES = {
  // Smoke test: Verify basic functionality
  smoke: {
    vus: 1,
    duration: '30s',
  },

  // Average load: Normal daily traffic
  average: {
    stages: [
      { duration: '2m', target: 50 },   // Ramp up
      { duration: '5m', target: 50 },   // Stay at 50 users
      { duration: '2m', target: 0 },    // Ramp down
    ],
  },

  // Stress test: Find breaking point
  stress: {
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '5m', target: 0 },
    ],
  },

  // Spike test: Sudden traffic surge
  spike: {
    stages: [
      { duration: '1m', target: 10 },   // Baseline
      { duration: '30s', target: 500 }, // Spike!
      { duration: '1m', target: 500 },  // Stay at spike
      { duration: '30s', target: 10 },  // Recovery
      { duration: '2m', target: 10 },   // Verify recovery
    ],
  },

  // Soak test: Sustained load over time
  soak: {
    stages: [
      { duration: '5m', target: 100 },  // Ramp up
      { duration: '30m', target: 100 }, // Sustained
      { duration: '5m', target: 0 },    // Ramp down
    ],
  },
}
