const production = process.env.NODE_ENV === "production";

const config = {
  logLevel: production ? "info" : "debug",
  baseUrl: production ? process.env.BASE_URL : "http://localhost:3000",
  redisHost: "redis",
  timeout: 20000,
};

export default config;
