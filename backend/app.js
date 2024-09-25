const express = require('express');
const mongoose = require('mongoose');
const WebSocket = require('ws');
const Dapr = require('dapr-client').DaprClient;

const app = express();
const PORT = 3000;
const WS_PORT = 8081;

const daprClient = new Dapr("127.0.0.1", 3500);

const TaskSchema = new mongoose.Schema({
  name: String,
  status: String,
  remark: String,
});

const Task = mongoose.model('Task', TaskSchema);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

// HTTP Routes
app.get('/tasks', async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
});

app.post('/tasks', async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.json(task);
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// Start WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`WebSocket server running on port ${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
});

// Subscribe to Dapr pub/sub
app.post('/dapr/subscribe', (req, res) => {
  res.json([
    {
      pubsubname: process.env.DAPR_PUBSUB_NAME,
      topic: 'tasks',
      route: '/events/tasks',
    },
  ]);
});

// Handle events from Dapr
app.post('/events/tasks', (req, res) => {
  const event = req.body;

  // Broadcast to WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(event));
    }
  });

  res.sendStatus(200);
});