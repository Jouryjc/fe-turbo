const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const cors = require("cors");
const kafka = require("kafka-node");

const app = express();
const PORT = 3000;
const WS_PORT = 8081;

const TaskSchema = new mongoose.Schema({
  name: String,
  status: String,
  remark: String,
});

const Task = mongoose.model("Task", TaskSchema);

mongoose.connect(
  process.env.MONGODB_URI ??
    "mongodb://admin:admin@127.0.0.1:27017/turbo?authSource=admin",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.use(express.json());
app.use(cors()); // 使用cors中间件

// HTTP Routes
app.get("/tasks", async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post("/tasks", async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting task with id: ${id}`);
  await Task.findByIdAndDelete(id);
  res.json({ message: 'Task deleted' });
});

app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const updatedTask = req.body;
  const task = await Task.findByIdAndUpdate(id, updatedTask, { new: true });
  res.json(task);
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Start WebSocket server
const ws = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`WebSocket server running on port ${WS_PORT}`);
});

ws.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Received message: ${message}`);
  });

  // 监听 data 事件
  ws.on("data", (data) => {
    console.log(`Received data: ${data}`);
  });
});

// Kafka client setup
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' });
const consumer = new kafka.Consumer(
  kafkaClient,
  [{ topic: 'turbo_turbo', partition: 0 }],
  { autoCommit: true }
);

consumer.on('message', (message) => {
  console.log(`Received Kafka message: ${message.value}`);
  // Broadcast message to all connected WebSocket clients
  ws.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message.value);
    }
  });
});

consumer.on('error', (err) => {
  console.error('Kafka consumer error:', err);
});