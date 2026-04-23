import { promises as fs } from "node:fs";
import path from "node:path";

function normalizeTags(values) {
  return values
    .map((value) =>
      String(value)
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$|^$/g, "")
    )
    .filter(Boolean);
}

function ensureIsoDate(value) {
  const trimmed = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  return new Date().toISOString().slice(0, 10);
}

function parseFrontmatter(source) {
  if (!source.startsWith("---")) {
    return { frontmatter: "", body: source };
  }
  const endIndex = source.indexOf("---", 3);
  if (endIndex === -1) {
    return { frontmatter: "", body: source };
  }
  const frontmatter = source.slice(0, endIndex + 3);
  const body = source.slice(endIndex + 3).trimStart();
  return { frontmatter, body };
}

function updateFrontmatter(frontmatter) {
  const lines = frontmatter.split("\n");
  const updated = [];
  let inTags = false;
  let tags = [];
  let lastUpdated = null;

  for (const line of lines) {
    if (line.startsWith("tags:")) {
      inTags = true;
      updated.push("tags:");
      continue;
    }
    if (inTags) {
      if (line.startsWith("  - ")) {
        tags.push(line.slice(4));
        continue;
      }
      inTags = false;
      const normalizedTags = normalizeTags(tags);
      for (const tag of normalizedTags) {
        updated.push(`  - ${tag}`);
      }
      tags = [];
    }

    if (line.startsWith("lastUpdated:")) {
      lastUpdated = line.split(":").slice(1).join(":").trim();
      updated.push(`lastUpdated: ${ensureIsoDate(lastUpdated)}`);
      continue;
    }

    updated.push(line);
  }

  if (inTags) {
    const normalizedTags = normalizeTags(tags);
    for (const tag of normalizedTags) {
      updated.push(`  - ${tag}`);
    }
  }

  if (!updated.includes("---")) {
    return frontmatter;
  }

  return updated.join("\n");
}

async function main() {
  const root = process.argv[2] || path.join(process.cwd(), "content");
  const entries = [];

  async function walk(dir) {
    const items = await fs.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        await walk(fullPath);
      } else if (item.isFile() && item.name.endsWith(".mdx")) {
        entries.push(fullPath);
      }
    }
  }

  await walk(root);

  for (const filePath of entries) {
    const source = await fs.readFile(filePath, "utf8");
    const { frontmatter, body } = parseFrontmatter(source);
    if (!frontmatter) {
      continue;
    }
    const updatedFrontmatter = updateFrontmatter(frontmatter);
    const output = `${updatedFrontmatter}\n${body}`;
    await fs.writeFile(filePath, output, "utf8");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});