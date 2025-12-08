
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
const cropBtn = document.getElementById("cropBtn");
const downloadBtn = document.getElementById("downloadBtn");

/* ---------- SELECT FRAME ---------- */
function selectFrame(src){
    frameImg.src = src;
    frameImg.style.display = "block";
    preview.style.display = "block";
    frameApplied = true;

    // Reset for new upload
    userImg.style.display = "none";
    downloadBtn.style.display = "none";
    cropBtn.style.display = "none";
}

/* ---------- CLICK PREVIEW TO UPLOAD IMAGE ---------- */
preview.onclick = () => {
    if (!frameApplied) return alert("Please select a frame first.");
    if (cropper) return; // prevent reopening while cropping
    uploadInput.click();
};

/* ---------- UPLOAD FILE ---------- */
uploadInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    if (cropper) {
        cropper.destroy();
        cropper = null;
    }

    userImg.src = url;
    userImg.style.display = "block";
    frameImg.style.display = "none"; // hide frame during crop setup

    userImg.onload = () => {
        cropper = new Cropper(userImg, {
            aspectRatio: 1,
            viewMode: 1
        });
    };

    cropBtn.style.display = "block";
};

/* ---------- APPLY CROP ---------- */
cropBtn.onclick = () => {
    if (!cropper) return;

    const croppedCanvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
    userImg.src = croppedCanvas.toDataURL("image/png");

    cropper.destroy();
    cropper = null;

    userImg.style.display = "block";
    frameImg.style.display = "block";

    cropBtn.style.display = "none";
    downloadBtn.style.display = "block";
    imageCropped = true;
};

/* ---------- DOWNLOAD FINAL ---------- */
downloadBtn.onclick = () => {
    if (!imageCropped) return;
    
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const w = preview.clientWidth;
    const h = preview.clientHeight;

    canvas.width = w;
    canvas.height = h;

    ctx.drawImage(userImg, 0, 0, w, h);
    ctx.drawImage(frameImg, 0, 0, w, h);

    const finalURL = canvas.toDataURL("image/png");

    const a = document.createElement("a");
    a.href = finalURL;
    a.download = "framed-photo.png";
    a.click();
};
