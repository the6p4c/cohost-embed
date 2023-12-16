const production = process.env.NODE_ENV === "production";

const config = {
  logLevel: production ? "info" : "debug",

  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 20000,
  homeRedirect: "https://github.com/the6p4c/cohost-embed#readme",

  screenshot: {
    default: {
      // based on an iPhone 14 Pro Max
      viewport: { width: 430, height: 932 },
      aspectRatio: { width: 430, height: 932 },
    },
    widescreen: {
      viewport: { width: 1920, height: 1080 },
      aspectRatio: { width: 16, height: 9 * 2 },
    },
    scale: 2,
  },
};

export default config;
