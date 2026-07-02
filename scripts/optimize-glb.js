#!/usr/bin/env node
/**
 * @file optimize-glb.js
 * @summary Batch-comprime arquivos .glb usando Draco via @gltf-transform/cli.
 *          Preserva os arquivos originais em uma pasta `_original`.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const inputDir = path.resolve(__dirname, "../assets/imgs/glb");
const originalDir = path.join(inputDir, "_original");

const files = fs
  .readdirSync(inputDir)
  .filter((f) => f.toLowerCase().endsWith(".glb"));

if (files.length === 0) {
  console.log("Nenhum arquivo .glb encontrado em", inputDir);
  process.exit(0);
}

fs.mkdirSync(originalDir, { recursive: true });

const results = [];

for (const file of files) {
  const inputPath = path.join(inputDir, file);
  const originalPath = path.join(originalDir, file);

  fs.copyFileSync(inputPath, originalPath);

  const beforeSize = fs.statSync(inputPath).size;

  try {
    execSync(
      `npx gltf-transform draco "${inputPath}" "${inputPath}" --method sequential --quantize-position 14`,
      { stdio: "inherit", cwd: path.resolve(__dirname, "..") },
    );
    const afterSize = fs.statSync(inputPath).size;
    const reduction = ((1 - afterSize / beforeSize) * 100).toFixed(1);
    results.push({
      file,
      before: beforeSize,
      after: afterSize,
      reduction,
    });
    console.log(
      `✓ ${file}: ${formatBytes(beforeSize)} → ${formatBytes(afterSize)} (${reduction}% menor)`,
    );
  } catch (err) {
    console.error(`✗ Falha ao comprimir ${file}:`, err.message);
    fs.copyFileSync(originalPath, inputPath);
    results.push({ file, error: err.message });
  }
}

console.log("\n=== Resumo da compressão ===");
for (const r of results) {
  if (r.error) {
    console.log(`${r.file}: ERRO - ${r.error}`);
  } else {
    console.log(
      `${r.file}: ${formatBytes(r.before)} → ${formatBytes(r.after)} (${r.reduction}% menor)`,
    );
  }
}

/**
 * Formats bytes into a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
