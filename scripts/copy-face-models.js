const fs = require("fs");
const path = require("path");

const sourceDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@vladmandic",
  "face-api",
  "model"
);
const targets = [
  path.join(__dirname, "..", "public", "models"),
  path.join(__dirname, "..", "hooks", "public", "models"),
];

const modelFiles = [
  "tiny_face_detector_model-weights_manifest.json",
  "tiny_face_detector_model.bin",
  "face_expression_model-weights_manifest.json",
  "face_expression_model.bin",
];

for (const targetDir of targets) {
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of modelFiles) {
    const source = path.join(sourceDir, file);
    const dest = path.join(targetDir, file);

    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
    }
  }
}
