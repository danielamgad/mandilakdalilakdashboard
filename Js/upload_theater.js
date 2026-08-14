const UPLOAD_API =
    "https://script.google.com/macros/s/AKfycbxeeHiejFId3Qtfu0Icn7-Za0cWwKkEzgc-Qhudoh7lUYt7NxrgM386GnbW-nmIyNnXcQ/exec";


/* =====================================================
   ELEMENTS
===================================================== */

const form =
    document.getElementById("theaterForm");

const fileInput =
    document.getElementById("fileInput");

const dropZone =
    document.getElementById("dropZone");

const fileList =
    document.getElementById("fileList");

const submitBtn =
    document.getElementById("submitBtn");

const successMessage =
    document.getElementById("successMessage");

const theaterIdResult =
    document.getElementById("theaterIdResult");


/* =====================================================
   FILES
===================================================== */

let selectedFiles = [];


/* =====================================================
   FILE INPUT
===================================================== */

fileInput.addEventListener("change", () => {

    addFiles(
        Array.from(fileInput.files)
    );

});


/* =====================================================
   DRAG & DROP
===================================================== */

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

    addFiles(
        Array.from(event.dataTransfer.files)
    );

});


/* =====================================================
   ADD FILES
===================================================== */

function addFiles(files) {

    const images =
        files.filter(
            file =>
                file.type.startsWith("image/")
        );


    selectedFiles.push(...images);

    renderFiles();

}


/* =====================================================
   RENDER FILES
===================================================== */

function renderFiles() {

    fileList.innerHTML = "";


    selectedFiles.forEach((file, index) => {

        const item =
            document.createElement("div");


        item.className =
            "file-item";


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


/* =====================================================
   REMOVE FILE
===================================================== */

function removeFile(index) {

    selectedFiles.splice(index, 1);

    renderFiles();

}


/* =====================================================
   FORMAT SIZE
===================================================== */

function formatSize(bytes) {

    if (bytes < 1024) {

        return bytes + " B";

    }


    if (bytes < 1024 * 1024) {

        return (
            (bytes / 1024).toFixed(1)
            + " KB"
        );

    }


    return (
        (bytes / (1024 * 1024)).toFixed(1)
        + " MB"
    );

}


/* =====================================================
   FILE → BASE64
===================================================== */

function fileToBase64(file) {

    return new Promise((resolve, reject) => {

        const reader =
            new FileReader();


        reader.onload = () => {

            const base64 =
                reader.result.split(",")[1];


            resolve(base64);

        };


        reader.onerror = () => {

            reject(
                new Error(
                    "تعذر قراءة الصورة"
                )
            );

        };


        reader.readAsDataURL(file);

    });

}


/* =====================================================
   UPLOAD IMAGE
===================================================== */

async function uploadImage(file) {

    const base64 =
        await fileToBase64(file);


    const response =
        await fetch(
            UPLOAD_API,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body: JSON.stringify({

                    action:
                        "uploadImage",

                    fileName:
                        file.name,

                    mimeType:
                        file.type,

                    data:
                        base64

                })

            }
        );


    const result =
        await response.json();


    if (!result.success) {

        throw new Error(
            result.error ||
            "فشل رفع الصورة"
        );

    }


    return result.url;

}


/* =====================================================
   SUBMIT THEATER
===================================================== */

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        submitBtn.disabled = true;


        submitBtn.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            جاري تجهيز المسرح...
        `;


        try {

            /* =========================================
               UPLOAD IMAGES
            ========================================== */

            const imageLinks = [];


            for (
                const file
                of selectedFiles
            ) {

                submitBtn.innerHTML = `
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    جاري رفع الصور...
                `;


                const url =
                    await uploadImage(file);


                imageLinks.push(url);

            }


            /* =========================================
               THEATER DATA
            ========================================== */

            const theaterData = {

                action:
                    "addTheater",


                placeName:
                    document
                        .getElementById("placeName")
                        .value
                        .trim(),


                capacity:
                    document
                        .getElementById("capacity")
                        .value
                    || 0,


                theaterHour:
                    document
                        .getElementById("theaterHour")
                        .value
                    || 0,


                theaterSoundAcHour:
                    document
                        .getElementById(
                            "theaterSoundAcHour"
                        )
                        .value
                    || 0,


                price:
                    document
                        .getElementById("price")
                        .value
                    || 0,


                insurance:
                    document
                        .getElementById("insurance")
                        .value
                    || 0,


                whatsapp:
                    document
                        .getElementById("whatsapp")
                        .value
                        .trim(),


                mapsUrl:
                    document
                        .getElementById("mapsUrl")
                        .value
                        .trim(),


                images:
                    imageLinks.join(" | "),


                description:
                    document
                        .getElementById("description")
                        .value
                        .trim()

            };


            /* =========================================
               SAVE TO GOOGLE SHEETS
            ========================================== */

            submitBtn.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                جاري حفظ البيانات...
            `;


            const response =
                await fetch(
                    UPLOAD_API,
                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "text/plain;charset=utf-8"

                        },

                        body:
                            JSON.stringify(
                                theaterData
                            )

                    }
                );


            const result =
                await response.json();


            if (!result.success) {

                throw new Error(
                    result.error ||
                    "فشل حفظ بيانات المسرح"
                );

            }


            /* =========================================
               SUCCESS
            ========================================== */

            form.style.display = "none";


            theaterIdResult.textContent =
                `رقم المسرح: ${result.id}`;


            successMessage.classList.add("show");


            /* =========================================
               REDIRECT
            ========================================== */

            setTimeout(() => {

                window.location.href =
                    "./upload_theater.html";

            }, 5000);


        } catch (error) {

            console.error(error);


            alert(
                "حدث خطأ:\n\n" +
                error.message
            );


            submitBtn.disabled = false;


            submitBtn.innerHTML = `
                <i class="fa-solid fa-plus"></i>
                إضافة المسرح
            `;

        }

    }
);  