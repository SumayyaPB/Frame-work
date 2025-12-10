const API_URL = "https://frame-work-backend.onrender.com";

let frameWidth = 1200;
let frameHeight = 1200;
const upscaleFactor = 2;
let finalCroppedCanvas = null;

/* ---------- FRAME LIST ---------- */
let frameList = [];

fetch(`${API_URL}/frames-list`)
  .then((res) => res.json())
  .then((files) => {
    frameList = files;
    populateFrames();
  })
  .catch((err) => {
    console.error("Error loading frames list:", err);
  });

/* ---------- DISPLAY FRAMES ---------- */
function populateFrames() {
  const gallery = document.getElementById("frame-gallery");
  if (!gallery) {
    console.error("No #frame-gallery element found");
    return;
  }

  gallery.innerHTML = "";

  frameList.forEach((src) => {
    const div = document.createElement("div");
    div.className = "frame-item";

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.src = src;

    div.onclick = () => selectFrame(src);

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

/* Safety check: log if any element is missing */
if (!preview || !userImg || !frameImg || !uploadInput || !uploadBtn || !cropBtn || !downloadBtn) {
  console.error("One or more required DOM elements are missing. Check your HTML IDs.");
}

/* ---------- SELECT FRAME ---------- */
function selectFrame(src) {
  resetUI(false); // don't hide gallery

  frameImg.onload = () => {
    frameWidth = frameImg.naturalWidth * upscaleFactor;
    frameHeight = frameImg.naturalHeight * upscaleFactor;
    console.log("Frame size:", frameWidth, frameHeight);
  };

  frameImg.crossOrigin = "anonymous";
  frameImg.src = src;

  frameImg.style.display = "block";
  preview.style.display = "block";
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
  // Remove any old cropper style hacks
  document
    .querySelectorAll(".hideCropperUI")
    .forEach((style) => style.remove());

  downloadBtn.style.display = "none";
  cropBtn.style.display = "block";

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (event) {
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }

    userImg.crossOrigin = "anonymous";
    userImg.src = event.target.result;

    userImg.style.display = "block";
    frameImg.style.display = "none";

    userImg.onload = () => {
      cropper = new Cropper(userImg, {
        aspectRatio: 1,
        viewMode: 1,
      });
    };
  };

  reader.readAsDataURL(file);
};

/* ---------- CROP ---------- */
cropBtn.onclick = () => {
  if (!cropper) return;

  finalCroppedCanvas = cropper.getCroppedCanvas({
    width: frameWidth,
    height: frameHeight,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  finalCroppedCanvas.toBlob((blob) => {

    let imageURL = URL.createObjectURL(blob);

    userImg.style.display = "block";
    userImg.src = imageURL;

    cropper.destroy();
    cropper = null;

    /* Force iPhone refresh */
    userImg.onload = () => {
      setTimeout(() => {

        // Hide crop UI
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
              display:none !important;
          }
        `;
        document.head.appendChild(styleFix);

        frameImg.style.display = "block";
        cropBtn.style.display = "none";
        downloadBtn.style.display = "block";
        imageCropped = true;

      }, 200); // the KEY fix — delay for iPhone
    };
  }, "image/png", 1.0);
};


/* ---------- DOWNLOAD FINAL ---------- */
downloadBtn.onclick = () => {
  if (!imageCropped || !finalCroppedCanvas) return;

  const canvas = document.getElementById("canvas");
  if (!canvas) {
    console.error("No #canvas element found");
    return;
  }

  const ctx = canvas.getContext("2d");

  const w = finalCroppedCanvas.width;
  const h = finalCroppedCanvas.height;

  canvas.width = w;
  canvas.height = h;

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
function resetUI(hidePreview = true) {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }

  frameApplied = false;
  imageCropped = false;

  cropBtn.style.display = "none";
  downloadBtn.style.display = "none";
  uploadBtn.style.display = "none";

  if (hidePreview) {
    preview.style.display = "none";
    userImg.style.display = "none";
    frameImg.style.display = "none";
  }

  userImg.src = "";
  frameImg.src = "";
  uploadInput.value = "";
}
