import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import http from "http"
import { Server } from "socket.io"
import { connectDB } from "./config/db.js"
import router from "./routes/userRoute.js"
import "./config/redis.js"

dotenv.config()

const app = express()

app.use(express.json())

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
  },
})

app.set("io", io)

app.use((req, res, next) => {
  req.io = req.app.get("io")
  next()
})

io.on("connection", (socket) => {
  socket.on("join_doctor", (doctorId) => {
    socket.join(`doctor:${doctorId}`)
  })

  socket.on("disconnect", () => {})
})

app.get("/", (req, res) => {
  res.status(200).send("Welcome to Smart Queue API!")
})

app.use("/v1/api", router)

const port = process.env.PORT || 8080

server.listen(port, async () => {
  console.log(`Server Listening on http://localhost:${port}`)
  await connectDB()
})
