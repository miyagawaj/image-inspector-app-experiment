# image-inspector-app-experiment

A simple, fully client-side image inspector built with plain HTML, CSS, and JavaScript. No dependencies, build step, or backend.

## Features

- Choose an image from your device and see a responsive preview.
- Inspect its file name, MIME type, exact size in bytes, and dimensions (width × height in pixels).
- Select another image to replace the current preview.
- Get a helpful message for invalid or unsupported images.
- Files stay on your device; nothing is uploaded to a server.

Image format support depends on your browser. If the browser does not report a MIME type, it is shown as “Unknown.”

## Run locally

### Open directly

Download or clone this repository, then open `index.html` in your browser. No installation is needed.

### Optional static server

With Python 3 installed, run this command from the repository directory:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open <http://127.0.0.1:8000> in your browser. Stop the server with `Ctrl+C`.
