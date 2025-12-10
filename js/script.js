const API_URL = "https://frame-work-backend.onrender.com";

// Base frame size (will be updated from selected frame)
let frameWidth = 1200;
let frameHeight = 1200;
const upscaleFactor = 2; // 2x clarity upgrade
const MAX_CANVAS_SIZE = 4096; // Safe for iOS and most devices

let finalCroppedCanvas = null;

/* ---------- FRAME LIST ---------- */
let frameList = [];

// Load frame list from backend
fetch(`${API_URL}/frames-list`)
  .then((res) => res.json())
  .then((files) => {
    frameList = files;
    populateFrames();
  })
  .catch((err) => {
    console.error("Error fetching frames list:", err);
  });

/* ---------- POPULATE FRAME GALLERY ---------- */
const gallery = document.getElementById("frame-gallery");

function populateFrames() {
  if (!gallery) return;

  gallery.innerHTML = "";

  frameList.forEach((src) => {
    const div = document.createElement("div");
    div.className = "frame-item";
    div.onclick = () => selectFrame(src);

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;

    div.appendChild(img);
    gallery.appendChild(div);
  });
}

/* ---------- ELEMENTS ---------- */
let cropper = null;
let frameApplied = false;
let imageCropped = false;

const preview = document.getElementById("preview-area");
const userImg = document.getElementById("user-photo");
const frameImg = document.getElementById("selected-frame");
const uploadInput = document.getElementById("upload");
const uploadBtn = document.getElementById("uploadBtn");
const cropBtn = document.getElementById("cropBtn");
const downloadBtn = document.getElementById("downloadBtn");

/* ---------- HELPER: DETECT iOS ---------- */
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* ---------- SELECT FRAME ---------- */
function selectFrame(src) {
  resetUI(); // Clear previous state, cropper, etc.

  frameImg.onload = () => {
    // Original frame size
    let w = frameImg.naturalWidth;
    let h = frameImg.naturalHeight;

    // Apply upscale factor
    w *= upscaleFactor;
    h *= upscaleFactor;

    // Clamp to safe max size (keeping aspect ratio)
    const scale = Math.min(
      1,
      MAX_CANVAS_SIZE / w,
      MAX_CANVAS_SIZE / h
    );

    frameWidth = Math.floor(w * scale);
    frameHeight = Math.floor(h * scale);

    console.log("Frame UHD (clamped) size:", frameWidth, frameHeight);
  };

  frameImg.crossOrigin = "anonymous";
  frameImg.src = src;
  frameImg.style.display = "block";

  if (preview) preview.style.display = "block";

  frameApplied = true;
  uploadBtn.style.display = "block";
}

/* ---------- CLICK UPLOAD BUTTON ---------- */
uploadBtn.onclick = () => {
  if (!frameApplied) {
    alert("Select a frame first");
    return;
  }
  uploadInput.click();
};

/* ---------- UPLOAD FILE ---------- */
uploadInput.onchange = (e) => {
  // Remove any old style that hides cropper UI
  document.querySelectorAll(".hideCropperUI").forEach((style) => style.remove());

  downloadBtn.style.display = "none";
  cropBtn.style.display = "block";

  const file = e.target.files[0];
  if (!file) return;

  // Destroy previous cropper if exists
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  // Use object URL instead of big dataURL (better for iOS)
  const objectUrl = URL.createObjectURL(file);

  userImg.crossOrigin = ""; // Not needed for local files
  userImg.loading = "eager";
  userImg.decoding = "sync";
  userImg.src = objectUrl;

  userImg.style.display = "block";
  frameImg.style.display = "none";

  userImg.onload = () => {
    URL.revokeObjectURL(objectUrl);

    cropper = new Cropper(userImg, {
      aspectRatio: 1,
      viewMode: 1,
    });
  };
};

/* ---------- CROP IMAGE ---------- */
cropBtn.onclick = () => {
  if (!cropper) return;

  finalCroppedCanvas = cropper.getCroppedCanvas({
    width: frameWidth,
    height: frameHeight,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "high",
  });

  if (!finalCroppedCanvas) return;

  // Replace user image with cropped result
  userImg.src = finalCroppedCanvas.toDataURL("image/png");

  // Destroy cropper and hide its UI
  cropper.destroy();
  cropper = null;

  const styleFix = document.createElement("style");
  styleFix.className = "hideCropperUI";
  styleFix.innerHTML = `
    .cropper-crop-box,
    .cropper-modal,
    .cropper-drag-box,
    .cropper-view-box,
    .cropper-dashed,
    .cropper-center,
    .cropper-face {
      display: none !important;
    }
  `;
  document.head.appendChild(styleFix);

  // Remove inline styles/class that Cropper added, let CSS handle layout
  userImg.removeAttribute("style");
  userImg.className = "";

  frameImg.style.display = "block";

  cropBtn.style.display = "none";
  downloadBtn.style.display = "block";
  imageCropped = true;
};

/* ---------- DOWNLOAD FINAL ---------- */
downloadBtn.onclick = () => {
  if (!imageCropped || !finalCroppedCanvas) return;

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const w = frameWidth;
  const h = frameHeight;

  canvas.width = w;
  canvas.height = h;

  // Reload frame image with CORS enabled for canvas export
  const tempImage = new Image();
  tempImage.crossOrigin = "anonymous";
  tempImage.src = frameImg.src;

  tempImage.onload = () => {
    // Draw cropped user image + frame
    ctx.drawImage(finalCroppedCanvas, 0, 0, w, h);
    ctx.drawImage(tempImage, 0, 0, w, h);

    const finalURL = canvas.toDataURL("image/png");

    if (isIOS()) {
      // iOS: open in new tab instead of relying on download attribute
      window.open(finalURL, "_blank");
    } else {
      const a = document.createElement("a");
      a.href = finalURL;
      a.download = "framed-photo.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    resetUI();
  };

  tempImage.onerror = (err) => {
    console.error("Error loading frame image for canvas:", err);
  };
};

/* ---------- RESET FUNCTION ---------- */
function resetUI() {
  // Destroy cropper if it exists
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  // Remove any style hacks
  document.querySelectorAll(".hideCropperUI").forEach((style) => style.remove());

  frameApplied = false;
  imageCropped = false;
  finalCroppedCanvas = null;

  cropBtn.style.display = "none";
  downloadBtn.style.display = "none";
  uploadBtn.style.display = "none";

  if (preview) preview.style.display = "none";

  userImg.style.display = "none";
  frameImg.style.display = "none";

  userImg.src = "";
  frameImg.src = "";
  uploadInput.value = "";
}
