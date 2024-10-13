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

export async function deleteTask(taskId) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete task')
  }
  return response.json()
}

export async function updateTask(taskId, updatedTask) {
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedTask)
  })
  if (!response.ok) {
    throw new Error('Failed to update task')
  }
  return response.json()
}