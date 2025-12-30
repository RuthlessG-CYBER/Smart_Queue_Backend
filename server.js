import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import router from "./routes/userRoute.js";
import { initRedis } from "./config/redis.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

app.set("io", io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

io.on("connection", (socket) => {
  socket.on("join_doctor", (doctorId) => {
    socket.join(`doctor:${doctorId}`);
  });
});

app.get("/", (req, res) => {
  res.status(200).send("Welcome to Smart Queue API!");
});

app.use("/v1/api", router);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

(async () => {
  try {
    await connectDB();
    await initRedis();
  } catch (err) {
    console.error("Startup error:", err.message);
  }
})();
