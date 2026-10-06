import {
  cp,
  mkdir,
  readlink,
  readdir,
  rm,
  stat,
  symlink,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const standaloneRoot = resolve(root, ".next/standalone");
const serverEntry = resolve(standaloneRoot, "server.js");

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function repairWindowsDirectoryLinks(directory) {
  if (process.platform !== "win32") return;

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isSymbolicLink()) {
      const linkTarget = await readlink(entryPath);
      const targetPath = resolve(dirname(entryPath), linkTarget);
      const target = await stat(targetPath);
      if (target.isDirectory()) {
        await rm(entryPath, { force: true });
        await symlink(linkTarget, entryPath, "dir");
      }
      continue;
    }
    if (entry.isDirectory()) {
      await repairWindowsDirectoryLinks(entryPath);
    }
  }
}

async function assertNoSqliteData(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await assertNoSqliteData(entryPath);
      continue;
    }
    if (/\.sqlite(?:-(?:wal|shm|journal))?$/i.test(entry.name)) {
      throw new Error(
        `Standalone artifact contains forbidden SQLite data: ${entryPath}`,
      );
    }
  }
}

if (!(await exists(serverEntry))) {
  throw new Error(
    "Missing .next/standalone/server.js. Run next build from products/kelaibao.",
  );
}

await mkdir(resolve(standaloneRoot, ".next"), { recursive: true });
await cp(resolve(root, ".next/static"), resolve(standaloneRoot, ".next/static"), {
  recursive: true,
  force: true,
});
if (await exists(resolve(root, "public"))) {
  await cp(resolve(root, "public"), resolve(standaloneRoot, "public"), {
    recursive: true,
    force: true,
  });
}
await rm(resolve(standaloneRoot, ".local-data"), {
  recursive: true,
  force: true,
});
await repairWindowsDirectoryLinks(standaloneRoot);
await assertNoSqliteData(standaloneRoot);

console.log("Standalone artifact packaged without embedding runtime secrets.");
