// src/services/websocket.js
export function setupWebSocket(onMessage) {
  const ws = new WebSocket('ws://127.0.0.1:8081')

  ws.onopen = () => {
    console.log('Connected to WebSocket server')
    ws.send(JSON.stringify({ message: 'Client connected' }))
  }

  ws.onmessage = (event) => {
    console.log('WebSocket message:', event.data)
    if (onMessage) {
      const task = JSON.parse(event.data)
      onMessage(task)
    }
  }

  ws.onclose = () => {
    console.log('WebSocket connection closed')
  }

  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }

  return ws
}