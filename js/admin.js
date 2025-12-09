const API_URL = "https://frame-work-backend.onrender.com";
// Login function - stores login ONLY in this browser tab
function loginAdmin() {
  let user = document.getElementById("adminUser").value;
  let pass = document.getElementById("adminPass").value;

  if (user === "admin" && pass === "1234") {
    // Store session only until tab/browser closes
    sessionStorage.setItem("isAdmin", "true");

    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";

    loadFrames();
  } else {
    alert("Invalid login");
  }
}

// Auto check admin login when page refreshes
window.onload = () => {
  if (sessionStorage.getItem("isAdmin") === "true") {
    document.getElementById("login-box").style.display = "none";
    document.getElementById("admin-panel").style.display = "block";
    loadFrames();
  }
};

// Logout + auto expire session
function logoutAdmin() {
  sessionStorage.removeItem("isAdmin");
  location.reload();
}

// Upload new frame to Node backend
function uploadFrame() {
  const file = document.getElementById("frameFile").files[0];
  if (!file) return;

  let formData = new FormData();
  formData.append("frame", file);

  fetch(`${API_URL}/upload-frame`, {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("uploadMsg").innerText = data.message;
      loadFrames();
    });
}

// Load frame list from backend
function loadFrames() {
  fetch(`https://frame-work-backend.onrender.com/frames-list`)
    .then((res) => res.json())
    .then((urls) => {
      let container = document.getElementById("frameList");
      container.innerHTML = "";

      urls.forEach((url) => {
        let wrapper = document.createElement("div");
        wrapper.style.textAlign = "center";

        let img = document.createElement("img");
        img.src = url;
        img.width = 100;

        // Extract Cloudinary public id
        const public_id = url.split("/").slice(-1)[0].split(".")[0];

        let btn = document.createElement("button");
        btn.innerText = "Delete";
        btn.onclick = () => deleteFrame(public_id);

        wrapper.appendChild(img);
        wrapper.appendChild(btn);
        container.appendChild(wrapper);
      });
    });
}

function deleteFrame(filename) {
  if (!confirm("Are you sure you want to delete this frame?")) return;

  fetch(`${API_URL}/delete-frame/` + filename, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      loadFrames(); // Refresh frame list
    });
}
function deleteFrame(public_id) {
  if (!confirm("Delete frame?")) return;

  fetch(`${API_URL}/delete-frame?public_id=${public_id}`, {
    method: "DELETE",
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message);
      loadFrames();
    });
}
