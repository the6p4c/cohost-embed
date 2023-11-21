/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  rewrites: async () => {
    return [
      // insert a dummy flag to simulate an optional route segment
      {
        source: "/:projectHandle/post/:slug",
        destination: "/_/:projectHandle/post/:slug",
      },
    ];
  },
};

module.exports = nextConfig;
