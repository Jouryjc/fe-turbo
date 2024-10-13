<template>
  <div class="task-list-container">
    <ix-modal v-model:visible="visible" header="任务">
      <ix-form label-align="left" label-col="6" wrapper-col="18">
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
      </ix-form>
      <template #footer>
        <ix-button @click="closeModal">取消</ix-button>
        <ix-button mode="primary" @click="handleAddTask">确定</ix-button>
      </template>
    </ix-modal>

    <ix-space align="center">
      <ix-button type="primary" @click="refresh()">刷新列表</ix-button>
      <ix-button type="primary" @click="openModal()">添加任务</ix-button>
    </ix-space>
    <ix-table :columns="columns" :dataSource="tasks">
      <template #name="{ value }">
        <ix-button mode="link">{{ value }}</ix-button>
      </template>
      <template #action="{ record }">
        <ix-button-group :gap="16" mode="link">
          <ix-button @click="handleUpdateTask(record)">编辑</ix-button>
          <ix-button @click="handleDeleteTask(record._id)">删除</ix-button>
        </ix-button-group>
      </template>
    </ix-table>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useMessage } from "@idux/components/message";
import {
  fetchTasks,
  addTask as apiAddTask,
  deleteTask as apiDeleteTask,
  updateTask as apiUpdateTask,
} from "../services/api";
import {
  saveTask,
  getAllTasks,
  clearTable,
  updateTable,
  deleteData,
} from "../services/indexdb"; // 使用 Dexie 实现
import { setupWebSocket } from "../services/websocket";

export default {
  name: "TaskList",
  setup() {
    const { info, success, warning, error, loading } = useMessage();
    const tasks = ref([]);
    const visible = ref(false);
    const newTask = ref({
      name: "",
      status: "pending",
      remark: "",
    });

    const statusOptions = [
      { label: "未开始", value: "pending" },
      { label: "进行中", value: "doing" },
      { label: "已完成", value: "finished" },
    ];

    const columns = [
      { title: "任务名称", dataKey: "name" },
      {
        title: "任务状态",
        dataKey: "status",
        customCell: ({ value }) => {
          const option = statusOptions.find((option) => option.value === value);
          const label =  option ? option.label : 'unknown';
          return label;
        }
      },
      { title: "备注", dataKey: "remark" },
      {
        title: "操作",
        customCell: "action",
        key: "action",
      },
    ];

    const openModal = () => {
      visible.value = true;
    };

    const closeModal = () => {
      visible.value = false;
    };

    const loadTasks = async (refresh) => {
      if (refresh) {
        const fetchedTasks = await fetchTasks();
        tasks.value = fetchedTasks;
        // 保存到 IndexedDB
        fetchedTasks.forEach((task) => saveTask(task));
        return;
      }

      try {
        // 从 IndexedDB 加载
        const indexedTasks = await getAllTasks();
        tasks.value = indexedTasks;
      } catch (error) {
        console.error(error);
        const fetchedTasks = await fetchTasks();
        tasks.value = fetchedTasks;
        // 保存到 IndexedDB
        fetchedTasks.forEach((task) => saveTask(task));
      }
    };

    const handleAddTask = async () => {
      try {
        const task = { ...newTask.value };
        // const addedTask = await apiAddTask(task)
        // tasks.value.push(addedTask)
        if (task._id) {
          await apiUpdateTask(task._id, task);
        } else {
          const addedTask = await apiAddTask(task);
          await saveTask(addedTask);
          tasks.value.push(addedTask);
        }
        // 清空输入字段
        newTask.value.name = "";
        newTask.value.status = "";
        newTask.value.remark = "";

        closeModal();
      } catch (error) {
        console.error(error);
      }
    };

    const handleDeleteTask = async (taskId) => {
      try {
        await apiDeleteTask(taskId);
        success("删除成功");
      } catch (error) {
        error("删除失败");
        console.error(error);
      }
    };

    const handleUpdateTask = async (task) => {
      newTask.value = task;

      openModal();
    };

    const handleWebSocketMessage = async (oplogMessage) => {
      // 将oplog的操作转成indexdb的更新操作
      const { collection, database, oplog } = oplogMessage;

      console.log("collection: %s, database: %s, oplog: %o", collection, database, oplog);

      const { _id, operation, row } = oplog;

      console.log("operation: %s, _id: %s, row: %o", operation, _id, row);

      switch (operation) {
        case "u":
          await updateTable(collection, row);
          break;
        case "d":
          await deleteData(collection, _id);
          break;
        case "i": // insert
          break;
        default:
          break;
      }

      loadTasks(false);
    };

    const refresh = async () => {
      await clearTable("tasks");
      loadTasks(true);
    };

    onMounted(() => {
      loadTasks();
      setupWebSocket(handleWebSocketMessage);
    });

    return {
      columns,
      tasks,
      visible,
      newTask,
      handleAddTask,
      handleDeleteTask,
      handleUpdateTask,
      refresh,
      statusOptions,
      openModal,
      closeModal,
    };
  },
};
</script>

<style scoped>
.task-list-container {
  margin: 20px auto;
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
