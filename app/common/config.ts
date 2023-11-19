const production = process.env.NODE_ENV === "production";

const config = {
  logLevel: production ? "info" : "debug",
  baseUrl: process.env.BASE_URL,
  redisHost: "redis",
  timeout: 20000,
};

export default config;
