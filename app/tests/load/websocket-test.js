/**
 * WebSocket Load Test
 *
 * Tests WebSocket connections under load.
 * Run with: k6 run tests/load/websocket-test.js
 */

import ws from 'k6/ws'
import { check, sleep } from 'k6'
import { Rate, Counter } from 'k6/metrics'
import { WS_URL, LOAD_PROFILES } from './config.js'

// Custom metrics
const wsErrors = new Rate('ws_errors')
const messagesReceived = new Counter('ws_messages_received')
const connectionTime = new Counter('ws_connection_time')

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 connections
    { duration: '3m', target: 50 },   // Hold
    { duration: '1m', target: 100 },  // Increase to 100
    { duration: '3m', target: 100 },  // Hold
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'ws_errors': ['rate<0.05'], // Less than 5% errors
    'ws_connection_time': ['count>0'], // At least some connections
  },
}

export default function () {
  const url = `${WS_URL}/socket.io/?EIO=4&transport=websocket`

  const startTime = Date.now()

  const res = ws.connect(url, {}, (socket) => {
    connectionTime.add(Date.now() - startTime)

    socket.on('open', () => {
      // Socket.io handshake
      socket.send('40')

      // Subscribe to notifications
      socket.send('42["subscribe","notifications"]')
    })

    socket.on('message', (data) => {
      messagesReceived.add(1)

      // Handle different message types
      if (data.startsWith('0')) {
        // Engine.io handshake
      } else if (data.startsWith('40')) {
        // Socket.io connection ack
      } else if (data.startsWith('42')) {
        // Event message
        try {
          const eventData = JSON.parse(data.slice(2))
          check(eventData, {
            'is valid event array': (e) => Array.isArray(e),
          })
        } catch {
          // Not JSON, might be ping/pong
        }
      }
    })

    socket.on('error', (e) => {
      wsErrors.add(1)
      console.error('WebSocket error:', e)
    })

    socket.on('close', () => {
      // Connection closed
    })

    // Keep connection open for a while
    sleep(30)

    // Send ping periodically
    socket.send('2')

    sleep(30)
  })

  check(res, {
    'WebSocket handshake succeeded': (r) => r && r.status === 101,
  }) || wsErrors.add(1)
}
