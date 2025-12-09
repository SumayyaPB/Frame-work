/* ---------- FRAME LIST ---------- */
const frameList = [
    "frames/frame1.png",
    "frames/frame2.png",
    "frames/frame3.png"
];

const gallery = document.getElementById("frame-gallery");

/* Populate frame thumbnails */
frameList.forEach(src => {
    let div = document.createElement("div");
    div.className = "frame-item";
    div.onclick = () => selectFrame(src);

    let img = document.createElement("img");
    img.src = src;

    div.appendChild(img);
    gallery.appendChild(div);
});

/* ---------- ELEMENTS ---------- */
let cropper = null;
let frameApplied = false;
let imageCropped = false;

const preview = document.getElementById("preview-area");
const userImg = document.getElementById("user-photo");
const frameImg = document.getElementById("selected-frame");
const uploadInput = document.getElementById("upload");
const uploadBtn = document.getElementById("uploadBtn"); // <<< NEW BUTTON
const cropBtn = document.getElementById("cropBtn");
const downloadBtn = document.getElementById("downloadBtn");

/* ---------- SELECT FRAME ---------- */
function selectFrame(src){
    resetUI();

    frameImg.src = src;
    frameImg.style.display = "block";
    preview.style.display = "block";
    frameApplied = true;

    uploadBtn.style.display = "block"; // <<< SHOW UPLOAD BUTTON
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

    // Remove previously injected hidden crop UI CSS
    document.querySelectorAll(".hideCropperUI").forEach(style => style.remove());

    // Hide download button when new upload happens
    downloadBtn.style.display = "none";
    cropBtn.style.display = "block";

    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    userImg.src = url;
    userImg.style.display = "block";
    frameImg.style.display = "none";

    userImg.onload = () => {
        cropper = new Cropper(userImg, {
            aspectRatio: 1,
            viewMode: 1
        });
    };
};

let finalCroppedCanvas = null;  // NEW

cropBtn.onclick = () => {
    if (!cropper) return;

      finalCroppedCanvas = cropper.getCroppedCanvas({
        width: 1200,   // High resolution output
        height: 1200
    })
    userImg.src = finalCroppedCanvas.toDataURL("image/png");

    cropper.destroy();
    cropper = null;

    /** Hide crop overlay elements — but NOT the image **/
    const styleFix = document.createElement("style");
    styleFix.className = "hideCropperUI";  // << IMPORTANT
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

    const w = finalCroppedCanvas.width;
    const h = finalCroppedCanvas.height;

    canvas.width = w;
    canvas.height = h;

    // draw cropped image in full clarity
    ctx.drawImage(finalCroppedCanvas, 0, 0, w, h);

    // draw frame in full clarity
    ctx.drawImage(frameImg, 0, 0, w, h);

    const finalURL = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = finalURL;
    a.download = "framed-photo.png";
    a.click();

    resetUI();
};

/* ---------- RESET FUNCTION ---------- */
function resetUI(){
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
