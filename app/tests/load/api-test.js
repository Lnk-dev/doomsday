/**
 * API Load Test
 *
 * Tests core API endpoints under load.
 * Run with: k6 run tests/load/api-test.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { BASE_URL, THRESHOLDS, LOAD_PROFILES } from './config.js'

// Custom metrics
const errorRate = new Rate('errors')
const postsFeedTrend = new Trend('posts_feed_duration')
const createPostTrend = new Trend('create_post_duration')

// Test configuration
export const options = {
  stages: LOAD_PROFILES.average.stages,
  thresholds: THRESHOLDS,
}

// Setup: Create test users and get tokens
export function setup() {
  // In a real scenario, you'd authenticate users here
  // and return their tokens
  return {
    tokens: [],
  }
}

export default function (data) {
  const baseUrl = BASE_URL

  group('Health Check', () => {
    const res = http.get(`${baseUrl}/health`)
    check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns healthy': (r) => {
        const body = JSON.parse(r.body)
        return body.status === 'healthy'
      },
    })
  })

  group('Public Endpoints', () => {
    // Get posts feed
    const feedStart = Date.now()
    const feedRes = http.get(`${baseUrl}/posts`, {
      tags: { name: 'posts_feed' },
    })
    postsFeedTrend.add(Date.now() - feedStart)

    check(feedRes, {
      'feed status is 200': (r) => r.status === 200,
      'feed has posts array': (r) => {
        try {
          const body = JSON.parse(r.body)
          return Array.isArray(body.posts)
        } catch {
          return false
        }
      },
    }) || errorRate.add(1)

    // Get events
    const eventsRes = http.get(`${baseUrl}/events`)
    check(eventsRes, {
      'events status is 200': (r) => r.status === 200,
    }) || errorRate.add(1)

    // Get users (leaderboard)
    const usersRes = http.get(`${baseUrl}/users`)
    check(usersRes, {
      'users status is 200': (r) => r.status === 200,
    }) || errorRate.add(1)
  })

  group('Geo Status', () => {
    const res = http.get(`${baseUrl}/geo/status`)
    check(res, {
      'geo status is 200': (r) => r.status === 200,
    })
  })

  // Simulate user think time
  sleep(Math.random() * 3 + 1)
}

export function teardown(data) {
  // Cleanup if needed
}
