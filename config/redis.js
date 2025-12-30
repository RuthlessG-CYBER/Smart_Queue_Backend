import { createClient } from "redis"
import "dotenv/config"

const redisClient = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: retries => Math.min(retries * 100, 3000),
  },
});

redisClient.on("connect", () => {
  console.log("Redis connected!");
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err.message);
});

await redisClient.connect();

export default redisClient;

