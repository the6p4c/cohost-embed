/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  rewrites: async () => {
    return [
      // insert a dummy flag to simulate an optional route segment
      {
        source: "/:projectHandle/post/:slug*",
        destination: "/_/:projectHandle/post/:slug*",
      },
    ];
  },
  env: {
    // wouldn't usually be exposed to the client since it doesn't start with NEXT_PUBLIC_
    BASE_URL: process.env.BASE_URL,
  },
};

module.exports = nextConfig;
