/**
 * Authenticated API Load Test
 *
 * Tests authenticated endpoints (posts, bets, etc.) under load.
 * Run with: k6 run tests/load/authenticated-test.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { SharedArray } from 'k6/data'
import { BASE_URL, THRESHOLDS, LOAD_PROFILES } from './config.js'

// Custom metrics
const errorRate = new Rate('errors')
const createPostTrend = new Trend('create_post_duration')
const placeBetTrend = new Trend('place_bet_duration')

// Test configuration
export const options = {
  stages: LOAD_PROFILES.average.stages,
  thresholds: {
    ...THRESHOLDS,
    'http_req_duration{name:create_post}': ['p(95)<500'],
    'http_req_duration{name:place_bet}': ['p(95)<500'],
  },
}

// Generate test users
const testUsers = new SharedArray('users', function () {
  const users = []
  for (let i = 0; i < 100; i++) {
    users.push({
      username: `loadtest_user_${i}`,
      token: null, // Would be populated during setup
    })
  }
  return users
})

export function setup() {
  // Register or login test users and get tokens
  const tokens = []

  for (let i = 0; i < Math.min(10, testUsers.length); i++) {
    const user = testUsers[i]

    // Try to register
    const registerRes = http.post(
      `${BASE_URL}/auth/register`,
      JSON.stringify({
        username: user.username,
        walletAddress: `0x${i.toString(16).padStart(40, '0')}`,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )

    if (registerRes.status === 201 || registerRes.status === 200) {
      const body = JSON.parse(registerRes.body)
      tokens.push(body.token)
    } else if (registerRes.status === 400) {
      // User exists, try login
      const loginRes = http.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({ username: user.username }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      )

      if (loginRes.status === 200) {
        const body = JSON.parse(loginRes.body)
        tokens.push(body.token)
      }
    }
  }

  return { tokens }
}

export default function (data) {
  const tokens = data.tokens
  if (tokens.length === 0) {
    console.error('No tokens available for authenticated testing')
    return
  }

  // Pick a random token
  const token = tokens[Math.floor(Math.random() * tokens.length)]
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  group('Authenticated - Read Operations', () => {
    // Get current user
    const meRes = http.get(`${BASE_URL}/auth/me`, { headers })
    check(meRes, {
      'me status is 200': (r) => r.status === 200,
      'me returns user': (r) => {
        try {
          const body = JSON.parse(r.body)
          return body.user && body.user.id
        } catch {
          return false
        }
      },
    }) || errorRate.add(1)

    // Get email preferences
    const prefsRes = http.get(`${BASE_URL}/email/preferences`, { headers })
    check(prefsRes, {
      'preferences status is 200': (r) => r.status === 200,
    })
  })

  group('Authenticated - Write Operations', () => {
    // Create a post (randomly ~20% of iterations)
    if (Math.random() < 0.2) {
      const postStart = Date.now()
      const postRes = http.post(
        `${BASE_URL}/posts`,
        JSON.stringify({
          content: `Load test post ${Date.now()}`,
          variant: Math.random() > 0.5 ? 'doom' : 'life',
        }),
        {
          headers,
          tags: { name: 'create_post' },
        }
      )
      createPostTrend.add(Date.now() - postStart)

      check(postRes, {
        'create post status is 201': (r) => r.status === 201,
      }) || errorRate.add(1)
    }
  })

  // Simulate realistic user behavior with varying think times
  sleep(Math.random() * 5 + 2)
}

export function teardown(data) {
  // Cleanup test posts if needed
}
