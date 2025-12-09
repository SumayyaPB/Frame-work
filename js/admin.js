

// Login function - stores login ONLY in this browser tab
function loginAdmin() {
    let user = document.getElementById("adminUser").value;
    let pass = document.getElementById("adminPass").value;

    if(user === "admin" && pass === "1234") {

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
    if(sessionStorage.getItem("isAdmin") === "true") {
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
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("uploadMsg").innerText = data.message;
        loadFrames();
    });
}

// Load frame list from backend
function loadFrames() {
    fetch(`${API_URL}/frames-list`)
    .then(res => res.json())
    .then(files => {
        let container = document.getElementById("frameList");
        container.innerHTML = "";

        files.forEach(f => {
    let wrapper = document.createElement("div");
    wrapper.style.display = "inline-block";
    wrapper.style.margin = "5px";
    wrapper.style.textAlign = "center";

    let img = document.createElement("img");
    img.src = `${API_URL}/frames/` + f;
    img.width = 100;

    let btn = document.createElement("button");
    btn.innerText = "Delete";
    btn.style.display = "block";
    btn.style.marginTop = "10px";
    btn.style.background = "#b92929";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.padding = "5px";
    btn.style.cursor = "pointer";
    btn.style.width ="90%"
    btn.style.margin ="10px auto"
    btn.style.height ="30px"
    btn.style.borderRadius ="5px"

    btn.onclick = () => deleteFrame(f);

    wrapper.appendChild(img);
    wrapper.appendChild(btn);
    container.appendChild(wrapper);
});

    });
}

function deleteFrame(filename) {
    if (!confirm("Are you sure you want to delete this frame?")) return;

    fetch(`${API_URL}/delete-frame/` + filename, {
        method: "DELETE"
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        loadFrames(); // Refresh frame list
    });
}
