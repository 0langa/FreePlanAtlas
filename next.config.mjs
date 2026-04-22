import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(fileURLToPath(import.meta.url));

const githubRepository = process.env.GITHUB_REPOSITORY;
const repoBasedPath = githubRepository ? `/${githubRepository.split("/")[1]}` : "";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || repoBasedPath || "";

const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  outputFileTracingRoot: repoRoot,
};

export default nextConfig;
