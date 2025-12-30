import { createClient } from "redis";
import dotenv from "dotenv";
dotenv.config();

let redisClient;

export const initRedis = async () => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL,
  });

  redisClient.on("connect", () => {
    console.log("Redis connected!");
  });

  redisClient.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  await redisClient.connect();
  return redisClient;
};

export default () => redisClient;
