
const fileInput = document.getElementById("fileInput");

const dropZone = document.getElementById("dropZone");

const fileList = document.getElementById("fileList");

const uploadBtn = document.getElementById("uploadBtn");

const results = document.getElementById("results");

const linksBox = document.getElementById("linksBox");

const copyBtn = document.getElementById("copyBtn");

// =====================================================
// GOOGLE APPS SCRIPT API
// =====================================================

const UPLOAD_API =
  "https://script.google.com/macros/s/AKfycbzrmb7K7sfv5E-iAAvrmo7cu-qQE7CWS7dv7zIuyFcilM-bcEWeCgBx81FNY0Wn2nt9Qg/exec";

// =====================================================
// SELECTED FILES
// =====================================================

let selectedFiles = [];

// =====================================================
// FILE SELECTION
// =====================================================

fileInput.addEventListener("change", () => {
  addFiles(Array.from(fileInput.files));
});

// =====================================================
// DRAG & DROP
// =====================================================

dropZone.addEventListener("dragover", (event) => {
  event.preventDefault();

  dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover");
});

dropZone.addEventListener("drop", (event) => {
  event.preventDefault();

  dropZone.classList.remove("dragover");

  addFiles(Array.from(event.dataTransfer.files));
});

// =====================================================
// ADD FILES
// =====================================================

function addFiles(files) {
  const images = files.filter((file) => file.type.startsWith("image/"));

  selectedFiles.push(...images);

  renderFiles();
}

// =====================================================
// RENDER FILES
// =====================================================

function renderFiles() {
  fileList.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const item = document.createElement("div");

    item.className = "file-item";

    item.innerHTML = `

            <div class="file-icon">

                <i class="fa-solid fa-image"></i>

            </div>


            <div class="file-info">

                <div class="file-name">
                    ${file.name}
                </div>

                <div class="file-size">
                    ${formatSize(file.size)}
                </div>

            </div>


            <button
                class="remove-file"
                onclick="removeFile(${index})"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

    fileList.appendChild(item);
  });

  uploadBtn.disabled = selectedFiles.length === 0;
}

// =====================================================
// REMOVE FILE
// =====================================================

function removeFile(index) {
  selectedFiles.splice(index, 1);

  renderFiles();
}

// =====================================================
// FORMAT FILE SIZE
// =====================================================

function formatSize(bytes) {
  if (bytes < 1024) {
    return bytes + " B";
  }

  if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(1) + " KB";
  }

  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// =====================================================
// CONVERT IMAGE TO BASE64
// =====================================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result.split(",")[1];

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("تعذر قراءة الصورة"));
    };

    reader.readAsDataURL(file);
  });
}

// =====================================================
// UPLOAD FILES
// =====================================================

uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    return;
  }

  uploadBtn.disabled = true;

  uploadBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        جاري رفع الصور...
    `;

  results.classList.remove("show");

  const uploadedLinks = [];

  try {
    // =============================================
    // UPLOAD EACH IMAGE
    // =============================================

    for (const file of selectedFiles) {
      const base64 = await fileToBase64(file);

      const response = await fetch(UPLOAD_API, {
        method: "POST",

        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },

        body: JSON.stringify({
          fileName: file.name,

          mimeType: file.type,

          data: base64,
        }),
      });

      const result = await response.json();

      // =========================================
      // CHECK RESPONSE
      // =========================================

      if (!result.success) {
        throw new Error(result.error || "فشل رفع الصورة");
      }

      uploadedLinks.push(result.url);
    }

    // =============================================
    // SHOW LINKS
    // =============================================

    linksBox.textContent = uploadedLinks.join(" | ");

    results.classList.add("show");

    // =============================================
    // SUCCESS
    // =============================================

    uploadBtn.innerHTML = `
            <i class="fa-solid fa-circle-check"></i>
            تم رفع الصور بنجاح
        `;
  } catch (error) {
    console.error(error);

    alert("حصل خطأ أثناء رفع الصور:\n\n" + error.message);

    uploadBtn.innerHTML = `
            <i class="fa-solid fa-upload"></i>
            رفع الصور
        `;
  }

  uploadBtn.disabled = false;
});

// =====================================================
// COPY LINKS
// =====================================================

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(linksBox.textContent);

    copyBtn.innerHTML = `
            <i class="fa-solid fa-check"></i>
            تم النسخ
        `;

    setTimeout(() => {
      copyBtn.innerHTML = `
                <i class="fa-solid fa-copy"></i>
                نسخ كل الروابط
            `;
    }, 2000);
  } catch (error) {
    alert("تعذر نسخ الروابط");
  }
});