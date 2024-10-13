// src/services/api.js
export const API_URL = 'http://127.0.0.1:3000/tasks'

export async function fetchTasks() {
  const response = await fetch(API_URL)
  if (!response.ok) {
    throw new Error('Failed to fetch tasks')
  }
  return response.json()
}

export async function addTask(task) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  })
  if (!response.ok) {
    throw new Error('Failed to add task')
  }
  return response.json()
}