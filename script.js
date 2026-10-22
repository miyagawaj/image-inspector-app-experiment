const fileInput = document.getElementById("image-file");
const status = document.getElementById("status");
const inspection = document.getElementById("inspection");
const preview = document.getElementById("preview");
let selection = 0;
let objectUrl;

function releaseObjectUrl() {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
  }
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const currentSelection = ++selection;
  fileInput.value = "";
  releaseObjectUrl();
  inspection.hidden = true;
  preview.replaceChildren();

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
