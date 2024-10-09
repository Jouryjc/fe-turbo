const taskList = document.getElementById('taskList');

async function loadTasks() {
  const response = await fetch('http://127.0.0.1:3000/tasks');
  const tasks = await response.json();
  tasks.forEach(addTaskToList);
}

function addTaskToList(task) {
  const li = document.createElement('li');
  li.textContent = `${task.name} - ${task.status} - ${task.remark}`;
  taskList.appendChild(li);

  // Save to IndexedDB
  saveTaskToIndexedDB(task);
}

async function addTask() {
  const name = document.getElementById('taskName').value;
  const status = document.getElementById('taskStatus').value;
  const remark = document.getElementById('taskRemark').value;

  const task = { name, status, remark };

  await fetch('http://127.0.0.1:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  });

  // Clear input fields
  document.getElementById('taskName').value = '';
  document.getElementById('taskStatus').value = '';
  document.getElementById('taskRemark').value = '';
}

// WebSocket setup
const ws = new WebSocket('ws://127.0.0.1:8081');

ws.onopen = () => {
  console.log('Connected to server');
  // 向服务端推送一条确认消息
  ws.send(JSON.stringify({ message: 'Client connected' }));
};

ws.onmessage = (event) => {
  console.log(event.data);
  const task = JSON.parse(event.data);
  addTaskToList(task);
};

// IndexedDB setup
function saveTaskToIndexedDB(task) {
  const request = indexedDB.open('tasksDB', 1);

  request.onupgradeneeded = (e) => {
    const db = e.target.result;
    db.createObjectStore('tasks', { keyPath: '_id' });
  };

  request.onsuccess = (e) => {
    const db = e.target.result;
    const tx = db.transaction('tasks', 'readwrite');
    const store = tx.objectStore('tasks');
    store.put(task);
  };
}

// Load tasks on startup
loadTasks();