import Dexie from 'dexie'

// 创建并配置 Dexie 数据库
const db = new Dexie('tasksDB')

// 定义数据库的版本和存储表
db.version(1).stores({
  tasks: '_id,name,status,remark,key' // 使用 '_id' 作为主键
})

// 获取任务表引用
const tasksTable = db.table('tasks')

export async function bulkSaveTasks(tasks) {
  try {
    await tasksTable.bulkPut(tasks)
  } catch (error) {
    console.error('Failed to save tasks to IndexedDB:', error)
  }
}

// 保存任务到 IndexedDB
export async function saveTask(task) {
  try {
    await tasksTable.put(task)
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

// 清空指定表的数据
export async function clearTable(tableName) {
  try {
    await db.table(tableName).clear()
    console.log(`Table '${tableName}' cleared in IndexedDB`)  
  } catch (error) {
    console.error(`Failed to clear table '${tableName}' in IndexedDB:`, error)
  }
}

// 更新指定数据库的数据，需要指定_id字段
export async function updateTable(tableName, data) {
  try {
    await db.table(tableName).put(data)
    console.log(`Table '${tableName}' updated in IndexedDB`)
  } catch (error) {
    console.error(`Failed to update table '${tableName}' in IndexedDB:`, error)
  }
}


// 删除指定数据库指定id的数据
export async function deleteData(tableName, id) {
  try {
    await db.table(tableName).delete(id)
    console.log(`Table '${tableName}' deleted in IndexedDB`)
  } catch (error) {
    console.error(`Failed to delete table '${tableName}' in IndexedDB:`, error)
  }
}