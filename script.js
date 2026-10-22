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

const sampleArtwork = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 500">
    <defs>
      <linearGradient id="surface" x2="1" y2="1">
        <stop stop-color="#3686c8"/>
        <stop offset=".5" stop-color="#65a8e0"/>
        <stop offset="1" stop-color="#3280c1"/>
      </linearGradient>
      <radialGradient id="metal">
        <stop stop-color="#eee9bd"/>
        <stop offset=".55" stop-color="#c4c27c"/>
        <stop offset=".7" stop-color="#292c19"/>
        <stop offset=".79" stop-color="#706f3a"/>
        <stop offset="1" stop-color="#22271a"/>
      </radialGradient>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComponentTransfer><feFuncA type="table" tableValues="0 .11"/></feComponentTransfer>
        <feBlend in="SourceGraphic" mode="soft-light"/>
      </filter>
    </defs>
    <rect width="720" height="500" fill="url(#surface)"/>
    <path d="M360 30v440M120 250h480" stroke="#325e83" stroke-width="2" opacity=".35"/>
    <g filter="url(#grain)" transform="translate(360 250) rotate(15)">
      <path d="M-18-112 13-115 34-69 92-35 96-8 58 22 37 81 9 87-25 52-81 28-89-1-55-38Z" fill="#282a18" stroke="#535535" stroke-width="8"/>
      <circle r="70" fill="url(#metal)" stroke="#171b12" stroke-width="8"/>
      <circle r="43" fill="#dedbb3" stroke="#282b1c" stroke-width="6"/>
      <circle r="31" fill="#7aa5d9" stroke="#f0edcf" stroke-width="7"/>
      <circle r="22" fill="#76a4de" stroke="#797b52" stroke-width="3"/>
      <path d="M-50-25q45-35 92-5M-52 27q47 27 99-5" fill="none" stroke="#aaa879" stroke-width="5" opacity=".8"/>
    </g>
    <path d="M360 80v80M360 340v90M210 250h80M430 250h90" stroke="#5482a8" stroke-width="2" opacity=".45"/>
  </svg>`;

document.getElementById("sample-image").src =
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sampleArtwork)}`;

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

document.getElementById("project-items").addEventListener("click", (event) => {
  const row = event.target.closest(".project-row");
  if (!row) return;

  document.querySelector(".project-row.selected .active-dot")?.remove();
  document.querySelector(".project-row.selected")?.classList.remove("selected");
  row.classList.add("selected");
  const dot = document.createElement("i");
  dot.className = "active-dot";
  row.append(dot);
});

document.getElementById("export-button").addEventListener("click", () => {
  const project = document.querySelector(".project-row.selected strong")?.textContent || "PM10";
  const content = `検査プログラム: ${project}\n判定結果: OK\nSUB010: 97.1%\nSUB020: 94.6%\n`;
  const download = document.createElement("a");
  download.href = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
  download.download = `${project}-inspection.txt`;
  download.click();
  URL.revokeObjectURL(download.href);
});

document.querySelector(".add-project").addEventListener("click", () => {
  const projects = document.getElementById("project-items");
  const nextNumber = projects.querySelectorAll(".project-row").length + 10;
  const row = document.createElement("button");
  row.className = "project-row";
  row.dataset.project = `PM${nextNumber}`;
  row.type = "button";
  const thumbnail = document.createElement("span");
  thumbnail.className = "thumbnail";
  thumbnail.textContent = "▧";
  const metadata = document.createElement("span");
  metadata.className = "project-meta";
  const name = document.createElement("strong");
  name.textContent = `PM${nextNumber}`;
  const status = document.createElement("small");
  status.append("ステータス: ");
  const available = document.createElement("b");
  available.textContent = "利用可";
  status.append(available);
  const actions = document.createElement("span");
  actions.className = "row-actions";
  actions.textContent = "✎　▢　▤";
  metadata.append(name, status);
  row.append(thumbnail, metadata, actions);
  projects.append(row);
  row.click();
});

window.addEventListener("pagehide", releaseObjectUrl);
