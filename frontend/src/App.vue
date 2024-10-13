<!-- src/App.vue -->
<template>
  <ix-message-provider>
    <task-list />
  </ix-message-provider>
</template>

<script>
import TaskList from './components/TaskList.vue'

export default {
  name: 'App',
  components: {
    TaskList
  }
}
</script>

<style>
body {
  background-color: #f0f2f5;
  font-family: Arial, sans-serif;
}
</style>