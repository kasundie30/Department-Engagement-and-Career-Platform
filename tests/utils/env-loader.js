/**
 * Utility: loads a .env file from the given path and returns key=value pairs as an object.
 * Does NOT modify process.env so tests stay isolated.
 */
const fs = require('fs');
const path = require('path');

function loadEnv(envFilePath) {
  const resolved = path.resolve(envFilePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`env-loader: file not found: ${resolved}`);
  }
  const content = fs.readFileSync(resolved, 'utf8');
  const env = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
  return env;
}

module.exports = { loadEnv };
