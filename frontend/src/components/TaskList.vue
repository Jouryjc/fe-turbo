<template>
  <div class="task-list-container">
    <h1>Todo List</h1>
    <ix-form @submit.prevent="handleAddTask" label-align="left" label-col="6" wrapper-col="18">
      <ix-form-item label="任务名称：" required>
        <ix-input v-model:value="newTask.name" placeholder="Task Name"></ix-input>
      </ix-form-item>
      <ix-form-item label="任务状态：" required>
        <ix-select v-model:value="newTask.status" placeholder="Task Status" :dataSource="statusOptions">
        </ix-select>
      </ix-form-item>
      <ix-form-item label="备注：">
        <ix-input v-model:value="newTask.remark" placeholder="Task Remark"></ix-input>
      </ix-form-item>
      <ix-form-item>
        <ix-space>
          <ix-button type="primary" html-type="submit">添加任务</ix-button>
        </ix-space>
      </ix-form-item>
    </ix-form>
    <ix-list bordered>
      <ix-button type="primary" @click="refresh()">刷新列表</ix-button>

      <ix-list-item v-for="task in tasks" :key="task._id">
        <div class="task-item">
          <div>
            <IxTag filled status="success">{{ task.name }}</IxTag>
            <ix-button icon="delete" shape="circle" @click="handleDeleteTask(task._id)"></ix-button>
            <ix-button icon="setting" shape="circle" @click="handleUpdateTask(task)"></ix-button>
          </div>
          <div>Status: {{ task.status }}</div>
          <div>Remark: {{ task.remark }}</div>
        </div>
      </ix-list-item>
    </ix-list>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { fetchTasks, addTask as apiAddTask, deleteTask as apiDeleteTask, updateTask as apiUpdateTask } from '../services/api'
import { saveTask, getAllTasks, clearTable } from '../services/indexdb' // 使用 Dexie 实现
import { setupWebSocket } from '../services/websocket'

export default {
  name: 'TaskList',
  setup() {
    const tasks = ref([])
    const newTask = ref({
      name: '',
      status: '',
      remark: ''
    })

    const statusOptions = [
      { label: '未开始', value: 'pending' },
      { label: '进行中', value: 'doing' },
      { label: '已完成', value: 'finished' }
    ]

    const loadTasks = async (refresh) => {
      if (refresh) {
        const fetchedTasks = await fetchTasks()
        tasks.value = fetchedTasks
        // 保存到 IndexedDB
        fetchedTasks.forEach(task => saveTask(task))
        return;
      }

      try {
        // 从 IndexedDB 加载
        const indexedTasks = await getAllTasks()
        tasks.value = indexedTasks
      } catch (error) {
        console.error(error)
        const fetchedTasks = await fetchTasks()
        tasks.value = fetchedTasks
        // 保存到 IndexedDB
        fetchedTasks.forEach(task => saveTask(task))
      }
    }

    const handleAddTask = async () => {
      try {
        const task = { ...newTask.value }
        const addedTask = await apiAddTask(task)
        tasks.value.push(addedTask)
        await saveTask(addedTask)
        // 清空输入字段
        newTask.value.name = ''
        newTask.value.status = ''
        newTask.value.remark = ''
      } catch (error) {
        console.error(error)
      }
    }

    const handleDeleteTask = async (taskId) => {
      try {
        await apiDeleteTask(taskId)
        // tasks.value = tasks.value.filter(task => task._id !== taskId)
      } catch (error) {
        console.error(error)
      }
    }

    const handleUpdateTask = async (task) => {
      try {
        const updatedTask = { ...task, status: 'updated' } // 示例更新逻辑
        await apiUpdateTask(task._id, updatedTask)
      } catch (error) {
        console.error(error)
      }
    }

    const handleWebSocketMessage = (task) => {
      tasks.value.push(task)
      saveTask(task)
    }

    const refresh = async () => {
      await clearTable("tasks")
      loadTasks(true)
    }

    onMounted(() => {
      loadTasks()
      setupWebSocket(handleWebSocketMessage)
    })

    return {
      tasks,
      newTask,
      handleAddTask,
      handleDeleteTask,
      handleUpdateTask,
      refresh,  
      statusOptions
    }
  }
}
</script>

<style scoped>
.task-list-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
}

.task-item {
  display: flex;
  flex-direction: column;
}

.task-item div {
  margin: 5px 0;
}
</style>