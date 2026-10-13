
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "node:crypto";
dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  })
);
app.use(express.json({ limit: "1mb" }));

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

let tasks = [];
let lastUpdate = null;

app.get("/", (req, res) => {
  res.json({
    message: "FlowBoard API is running",
    connectedClients: io.engine.clientsCount,
  });
});

app.get("/api/tasks", (req, res) => {
  res.json({
    success: true,
    tasks,
    lastUpdate,
  });
});

app.post("/api/tasks", (req, res) => {
  const { title, status, priority } = req.body || {};

  if (typeof title !== "string" || !title.trim()) {
    return res.status(400).json({
      success: false,
      message: "Task title is required",
    });
  }

  const validStatuses = ["todo", "progress", "review", "done"];
  const validPriorities = ["Low", "Medium", "High"];

  const task = {
    id: randomUUID(),
    title: title.trim(),
    description:
      typeof req.body.description === "string"
        ? req.body.description
        : "",
    status: validStatuses.includes(status) ? status : "todo",
    priority: validPriorities.includes(priority)
      ? priority
      : "Medium",
    assignee:
      typeof req.body.assignee === "string"
        ? req.body.assignee
        : "",
    dueDate:
      typeof req.body.dueDate === "string"
        ? req.body.dueDate
        : "",
    tags: Array.isArray(req.body.tags) ? req.body.tags : [],
    comments: [],
  };

  tasks.push(task);
  lastUpdate = new Date().toISOString();

  io.emit("board:update", tasks);

  res.status(201).json({
    success: true,
    task,
  });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("board:initial", tasks);

  socket.on("board:update", (incomingTasks) => {
    if (
      !Array.isArray(incomingTasks) ||
      incomingTasks.length > 1000
    ) {
      socket.emit("board:error", "Invalid board data");
      return;
    }

    const validStatuses = ["todo", "progress", "review", "done"];
    const validPriorities = ["Low", "Medium", "High"];

    const validTasks = incomingTasks.every((task) => {
      return (
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        task.title.trim().length > 0 &&
        task.title.length <= 150 &&
        validStatuses.includes(task.status) &&
        validPriorities.includes(task.priority) &&
        (task.description == null ||
          (typeof task.description === "string" &&
            task.description.length <= 2000)) &&
        (task.assignee == null ||
          (typeof task.assignee === "string" &&
            task.assignee.length <= 80)) &&
        (task.tags == null ||
          (Array.isArray(task.tags) &&
            task.tags.length <= 30 &&
            task.tags.every(
              (tag) =>
                typeof tag === "string" && tag.length <= 30
            ))) &&
        (task.comments == null ||
          (Array.isArray(task.comments) &&
            task.comments.length <= 500 &&
            task.comments.every(
              (comment) =>
                comment &&
                typeof comment.text === "string" &&
                comment.text.length <= 2000
            )))
      );
    });

    if (!validTasks) {
      socket.emit("board:error", "Invalid task data");
      return;
    }

    tasks = incomingTasks;
    lastUpdate = new Date().toISOString();

    // Broadcast the new board to every connected client.
    io.emit("board:update", tasks);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`FlowBoard server running on port ${PORT}`);
});
