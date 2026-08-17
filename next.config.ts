import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits .next/standalone with only the traced runtime dependencies, which keeps the
  // production image small. See the Dockerfile runner stage.
  output: "standalone",
};

export default nextConfig;
