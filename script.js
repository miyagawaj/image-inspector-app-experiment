const fileInput = document.getElementById("image-file");
const status = document.getElementById("status");
const inspection = document.getElementById("inspection");
const preview = document.getElementById("preview");
const detectButton = document.getElementById("detect-button");
const detectionStatus = document.getElementById("detection-status");
const detectionsList = document.getElementById("detections");
let selection = 0;
let objectUrl;
let modelPromise;

function releaseObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  }
}

function drawDetections(image, predictions) {
  const canvas = document.createElement("canvas");
  canvas.className = "detection-overlay";
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const context = canvas.getContext("2d");
  context.strokeStyle = "#16a34a";
  context.fillStyle = "#16a34a";
  context.lineWidth = Math.max(2, image.naturalWidth / 500);
  context.font = `${Math.max(14, image.naturalWidth / 40)}px sans-serif`;

  for (const prediction of predictions) {
    const [x, y, width, height] = prediction.bbox;
    const label = `${prediction.class} (${Math.round(prediction.score * 100)}%)`;
    const labelHeight = Math.max(20, image.naturalWidth / 30);

    context.strokeRect(x, y, width, height);
    context.fillRect(x, Math.max(0, y - labelHeight), context.measureText(label).width + 8, labelHeight);
    context.fillStyle = "#fff";
    context.fillText(label, x + 4, Math.max(labelHeight * 0.75, y - labelHeight * 0.2));
    context.fillStyle = "#16a34a";
  }

  const stage = document.createElement("div");
  stage.className = "image-stage";
  stage.append(image, canvas);
  preview.replaceChildren(stage);
}

detectButton.addEventListener("click", async () => {
  const image = preview.querySelector("img");
  if (!image) return;

  const currentSelection = selection;
  detectButton.disabled = true;
  detectionStatus.textContent = "Loading object detection model…";
  detectionsList.replaceChildren();

  try {
    if (!modelPromise) {
      modelPromise = cocoSsd.load();
    }
    const model = await modelPromise;
    if (currentSelection !== selection) return;

    detectionStatus.textContent = "Detecting objects…";
    const predictions = await model.detect(image);
    if (currentSelection !== selection) return;

    drawDetections(image, predictions);
    for (const prediction of predictions) {
      const item = document.createElement("li");
      item.textContent = `${prediction.class} — ${Math.round(prediction.score * 100)}% confidence`;
      detectionsList.append(item);
    }
    detectionStatus.textContent = predictions.length
      ? `Found ${predictions.length} ${predictions.length === 1 ? "object" : "objects"}.`
      : "No objects detected.";
  } catch {
    if (currentSelection !== selection) return;

    modelPromise = undefined;
    detectionStatus.textContent = "Object detection is unavailable. Check your connection and try again.";
  } finally {
    if (currentSelection === selection) {
      detectButton.disabled = false;
    }
  }
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const currentSelection = ++selection;
  fileInput.value = "";
  releaseObjectUrl();
  inspection.hidden = true;
  preview.replaceChildren();
  detectionStatus.textContent = "";
  detectionsList.replaceChildren();
  detectButton.disabled = false;

  if (file.type && !file.type.startsWith("image/")) {
    status.textContent = "Please choose an image file.";
    return;
  }

  status.textContent = "Loading image…";
  const image = new Image();
  image.alt = `Preview of ${file.name}`;

  image.onload = () => {
    if (currentSelection !== selection) return;

    document.getElementById("file-name").textContent = file.name;
    document.getElementById("mime-type").textContent = file.type || "Unknown";
    document.getElementById("file-size").textContent = `${file.size} bytes`;
    document.getElementById("dimensions").textContent =
      `${image.naturalWidth} × ${image.naturalHeight} pixels`;
    preview.replaceChildren(image);
    inspection.hidden = false;
    status.textContent = "Image ready.";
    releaseObjectUrl();
  };

  image.onerror = () => {
    if (currentSelection !== selection) return;

    status.textContent = "Unable to read this image. Choose a valid image supported by your browser.";
    releaseObjectUrl();
  };

  objectUrl = URL.createObjectURL(file);
  image.src = objectUrl;
});

window.addEventListener("pagehide", releaseObjectUrl);
