<!-- src/components/TaskList.vue -->
<template>
  <div class="task-list-container">
    <h1>Todo List</h1>
    <ix-form @submit.prevent="handleAddTask">
      <ix-form-item label="任务名称">
        <ix-input v-model="newTask.name" placeholder="Task Name" required></ix-input>
      </ix-form-item>
      <ix-form-item label="任务状态">
        <ix-select v-model="newTask.status" placeholder="Task Status" :options="statusOptions" required></ix-select>
      </ix-form-item>
      <ix-form-item label="备注">
        <ix-input v-model="newTask.remark" placeholder="Task Remark"></ix-input>
      </ix-form-item>
      <ix-form-item>
        <ix-button type="primary" html-type="submit">添加任务</ix-button>
      </ix-form-item>
    </ix-form>
    <ix-list bordered>
      <ix-list-item v-for="task in tasks" :key="task._id">
        <div class="task-item">
          <div><strong>{{ task.name }}</strong></div>
          <div>Status: {{ task.status }}</div>
          <div>Remark: {{ task.remark }}</div>
        </div>
      </ix-list-item>
    </ix-list>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { fetchTasks, addTask as apiAddTask } from '../services/api'
import { saveTask, getAllTasks } from '../services/indexdb' // 使用 Dexie 实现
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
      { label: '未开始', value: '未开始' },
      { label: '进行中', value: '进行中' },
      { label: '已完成', value: '已完成' }
    ]

    const loadTasks = async () => {
      try {
        const fetchedTasks = await fetchTasks()
        tasks.value = fetchedTasks
        // 保存到 IndexedDB
        fetchedTasks.forEach(task => saveTask(task))
      } catch (error) {
        console.error(error)
        // 从 IndexedDB 加载
        const indexedTasks = await getAllTasks()
        tasks.value = indexedTasks
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

    const handleWebSocketMessage = (task) => {
      tasks.value.push(task)
      saveTask(task)
    }

    onMounted(() => {
      loadTasks()
      setupWebSocket(handleWebSocketMessage)
    })

    return {
      tasks,
      newTask,
      handleAddTask,
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