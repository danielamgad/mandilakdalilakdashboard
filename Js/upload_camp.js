const UPLOAD_API =
  "https://script.google.com/macros/s/AKfycbxeeHiejFId3Qtfu0Icn7-Za0cWwKkEzgc-Qhudoh7lUYt7NxrgM386GnbW-nmIyNnXcQ/exec";

// =====================================================
// ELEMENTS
// =====================================================

const form = document.getElementById("campForm");

const fileInput = document.getElementById("fileInput");

const dropZone = document.getElementById("dropZone");

const fileList = document.getElementById("fileList");

const submitBtn = document.getElementById("submitBtn");

const successMessage = document.getElementById("successMessage");

const campIdResult = document.getElementById("campIdResult");

// =====================================================
// FILES
// =====================================================

let selectedFiles = [];

// =====================================================
// FILE INPUT
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
                type="button"
                class="remove-file"
                onclick="removeFile(${index})"
            >

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

    fileList.appendChild(item);
  });
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
// FILE → BASE64
// =====================================================

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const base64 = reader.result.split(",")[1];

        if (!base64) {
          reject(new Error("تعذر تحويل الصورة"));

          return;
        }

        resolve(base64);
      } catch (error) {
        reject(new Error("تعذر قراءة الصورة"));
      }
    };

    reader.onerror = () => {
      reject(new Error("تعذر قراءة الصورة"));
    };

    reader.readAsDataURL(file);
  });
}

// =====================================================
// UPLOAD IMAGE
// =====================================================

async function uploadImage(file) {
  const base64 = await fileToBase64(file);

  const response = await fetch(UPLOAD_API, {
    method: "POST",

    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },

    body: JSON.stringify({
      action: "uploadImage",

      fileName: file.name,

      mimeType: file.type,

      data: base64,
    }),
  });

  if (!response.ok) {
    throw new Error("فشل الاتصال بخدمة رفع الصور");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "فشل رفع الصورة");
  }

  return result.url;
}

// =====================================================
// SUBMIT CAMP
// =====================================================

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submitBtn.disabled = true;

  submitBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            جاري تجهيز المعسكر...
        `;

  try {
    // =================================================
    // 1. UPLOAD IMAGES
    // =================================================

    const imageLinks = [];

    for (const file of selectedFiles) {
      submitBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    جاري رفع الصور...
                `;

      const url = await uploadImage(file);

      imageLinks.push(url);
    }

    // =================================================
    // 2. COLLECT FORM DATA
    // =================================================

    const campData = {
      action: "addCamp",

      placeName: document.getElementById("placeName").value.trim(),

      governorate: document.getElementById("governorate").value.trim(),

      area: document.getElementById("area").value || 0,

      nature: document.getElementById("nature").value.trim(),

      waterCoolers: document.getElementById("waterCoolers").value || 0,

      stoves: document.getElementById("stoves").value || 0,

      capacityPersons: document.getElementById("capacityPersons").value || 0,

      capacityTents: document.getElementById("capacityTents").value || 0,

      weather: document.getElementById("weather").value.trim(),

      dangers: document.getElementById("dangers").value.trim(),

      footballField: document.getElementById("footballField").value || 0,

      swimmingPool: document.getElementById("swimmingPool").value || 0,

      pricePerson: document.getElementById("pricePerson").value || 0,

      whatsapp: document.getElementById("whatsapp").value.trim(),

      mapsUrl: document.getElementById("mapsUrl").value.trim(),

      images: imageLinks.join(" | "),

      description: document.getElementById("description").value.trim(),
    };

    // =================================================
    // 3. SEND TO GOOGLE SHEETS
    // =================================================

    submitBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                جاري حفظ البيانات...
            `;

    const response = await fetch(UPLOAD_API, {
      method: "POST",

      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },

      body: JSON.stringify(campData),
    });

    if (!response.ok) {
      throw new Error("فشل الاتصال بقاعدة البيانات");
    }

    const result = await response.json();

    // =================================================
    // 4. CHECK RESPONSE
    // =================================================

    if (!result.success) {
      throw new Error(result.error || "فشل حفظ بيانات المعسكر");
    }

    // =================================================
    // 5. SUCCESS
    // =================================================

    form.reset();

    selectedFiles = [];

    fileList.innerHTML = "";

    form.style.display = "none";

    campIdResult.textContent = `رقم المعسكر: ${result.id}`;

    successMessage.classList.add("show");

    // =================================================
    // 6. REDIRECT AFTER 5 SECONDS
    // =================================================

    setTimeout(() => {
      window.location.href = "./upload_camp.html";
    }, 5000);
  } catch (error) {
    // =================================================
    // ERROR HANDLING
    // =================================================

    console.error("Camp upload error:", error);

    alert("حدث خطأ أثناء إضافة المعسكر:\n\n" + error.message);

    submitBtn.disabled = false;

    submitBtn.innerHTML = `
                <i class="fa-solid fa-plus"></i>
                إضافة المعسكر
            `;
  }
});
