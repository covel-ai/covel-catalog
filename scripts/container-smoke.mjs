import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";

const docker = (...args) => execFileSync("docker", args, { encoding: "utf8" }).trim();
const image = process.argv[2] ?? "covel-catalog:test";
const name = `covel-catalog-smoke-${process.pid}`;
const volume = `${name}-data`;
docker("volume", "create", volume);
try {
  docker("run", "--detach", "--name", name, "--read-only", "--tmpfs", "/tmp:size=64m", "--cap-drop=ALL", "--security-opt", "no-new-privileges", "--memory=2g", "--publish", "127.0.0.1::8787", "--volume", `${volume}:/data`, image);
  const address = docker("port", name, "8787/tcp");
  const origin = `http://${address}`;
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try { ready = (await fetch(`${origin}/healthz`, { signal: AbortSignal.timeout(1000) })).status === 200; } catch {}
    if (ready) break;
    await setTimeout(250);
  }
  assert.ok(ready, "container must start within 10 seconds");
  assert.notEqual(docker("exec", name, "id", "-u"), "0");
  assert.equal(docker("inspect", "--format", "{{.HostConfig.ReadonlyRootfs}}", name), "true");
  assert.equal((await fetch(`${origin}/v1/catalog?kind=worlds`)).status, 503);
  assert.equal((await fetch(`${origin}/v1/policy`)).status, 503);
  docker("restart", name);
  console.log("Container: non-root, read-only, persistent volume, health 200, uninitialized policy/catalog 503");
} finally {
  try { docker("rm", "--force", name); } catch {}
  docker("volume", "rm", volume);
}
