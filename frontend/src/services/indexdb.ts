// src/services/indexedDB.js
import Dexie from 'dexie'

// 创建并配置 Dexie 数据库
const db = new Dexie('tasksDB')

// 定义数据库的版本和存储表
db.version(1).stores({
  tasks: '_id,name,status,remark' // 使用 '_id' 作为主键
})

// 获取任务表引用
const tasksTable = db.table('tasks')

// 保存任务到 IndexedDB
export async function saveTask(task) {
  try {
    await tasksTable.put(task)
    console.log('Task saved to IndexedDB')
  } catch (error) {
    console.error('Failed to save task to IndexedDB:', error)
  }
}

// 获取所有任务
export async function getAllTasks() {
  try {
    const allTasks = await tasksTable.toArray()

    console.log('%d tasks fetched from IndexedDB', allTasks.length)
    return allTasks
  } catch (error) {
    console.error('Failed to fetch tasks from IndexedDB:', error)
    return []
  }
}