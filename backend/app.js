const express = require("express");
const mongoose = require("mongoose");
const WebSocket = require("ws");
const cors = require("cors");

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

  // 消费kafka的消息，然后将消息发送到客户端

});
