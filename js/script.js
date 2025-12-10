const API_URL = "https://frame-work-backend.onrender.com";
let frameWidth = 1200;
let frameHeight = 1200;
const upscaleFactor = 2;
let finalCroppedCanvas = null;

/* ---------- FRAME LIST ---------- */
let frameList = [];

fetch(`${API_URL}/frames-list`)
  .then(res => res.json())
  .then(files => {
    frameList = files;
    populateFrames();
  });

function populateFrames() {
  const gallery = document.getElementById("frame-gallery");
  gallery.innerHTML = "";

  frameList.forEach(src => {
    let div = document.createElement("div");
    div.className = "frame-item";
    div.onclick = () => selectFrame(src);

    let img = document.createElement("img");
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

/* ---------- SELECT FRAME ---------- */
function selectFrame(src) {
  resetUI();

  frameImg.onload = () => {
    frameWidth = frameImg.naturalWidth * upscaleFactor;
    frameHeight = frameImg.naturalHeight * upscaleFactor;
  };

  frameImg.crossOrigin = "anonymous";
  frameImg.src = src;
  frameImg.style.display = "block";
  preview.style.display = "block";
  frameApplied = true;

  setTimeout(() => {
    uploadBtn.style.display = "block";
  }, 200);
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
uploadInput.onchange = e => {
  document.querySelectorAll(".hideCropperUI").forEach(style => style.remove());

  downloadBtn.style.display = "none";
  cropBtn.style.display = "block";

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function (event) {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    userImg.crossOrigin = "anonymous";
    userImg.loading = "eager";
    userImg.decoding = "sync";
    userImg.src = event.target.result;

    try {
      await userImg.decode?.();
    } catch (e) {}

    userImg.style.display = "block";
    frameImg.style.display = "none";

    setTimeout(() => {
      cropper = new Cropper(userImg, {
        aspectRatio: 1,
        viewMode: 1,
      });
    }, 200);
  };

  reader.readAsDataURL(file);
};

/* ---------- CROP ---------- */
cropBtn.onclick = () => {
  if (!cropper) return;

  finalCroppedCanvas = cropper.getCroppedCanvas({
    width: frameWidth,
    height: frameHeight,
    imageSmoothingEnabled: false,
    imageSmoothingQuality: "high",
  });

  userImg.src = finalCroppedCanvas.toDataURL("image/png", 1.0);

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

  canvas.width = finalCroppedCanvas.width;
  canvas.height = finalCroppedCanvas.height;

  const tempImage = new Image();
  tempImage.crossOrigin = "anonymous";
  tempImage.src = frameImg.src;

  tempImage.onload = () => {
    ctx.drawImage(finalCroppedCanvas, 0, 0, frameWidth, frameHeight);
    ctx.drawImage(tempImage, 0, 0, frameWidth, frameHeight);

    const finalURL = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = finalURL;
    a.download = "framed-photo.png";
    a.click();

    resetUI();
  };
};

/* ---------- RESET ---------- */
function resetUI() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  frameApplied = false;
  imageCropped = false;

  cropBtn.style.display = "none";
  downloadBtn.style.display = "none";
  uploadBtn.style.display = "none";

  preview.style.display = "none";
  userImg.style.display = "none";
  frameImg.style.display = "none";

  userImg.src = "";
  frameImg.src = "";
  uploadInput.value = "";
}
