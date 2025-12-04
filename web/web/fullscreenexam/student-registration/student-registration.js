// Select elements
let $form = $("#registrationForm");
let $videoElement = $("#videoElement");
let $captureBtn = $("#captureBtn");
let $photoPreview = $("#photoPreview");
let $docPreview = $("#docPreview");
let $studentPhotoInput = $("#studentPhoto");
let $studentIdInput = $("#studentId");
let renamedAttachmentFile = null

let stream = null;
let canvas = $("#photoCanvas")[0];

let faceValidator = null;

let defaultPhotoPreviewHtml = $photoPreview.html();
let defaultDocPreviewHtml = $docPreview.html();

const urlParams = new URLSearchParams(window.location.search);
let attenderId = urlParams.get("attenderId");

let canGetPersonalDetails = true;
let canGetPhotos = false;
let canGetIdDocument = false;
let collegeCode;

$(document).ready(function () {

  // Update language toggle label based on current language
  function updateLanguageToggleLabel() {
    const currentLang = localStorage.getItem('lang') || 'en';
    const $toggleLabel = $('#language-toggle-label');
    
    // if (currentLang === 'en') {
    //   $toggleLabel.text('العربية');
    // } else {
    //   $toggleLabel.text('English');
    // }
  }
  
  // Update the label on page load
  updateLanguageToggleLabel();
  
  // Update the label whenever language is changed
  $('#lang-toggle').on('change', function() {
    setTimeout(updateLanguageToggleLabel, 100);
  });

  $(".first-name").on("input",function(){
    $(this).css({border:"2px solid #e2e8f0"})
    $(".first-name-error").text("")
  })

  $(".last-name").on("input",function(){
    $(this).css({border:"2px solid #e2e8f0"})
    $(".last-name-error").text("")
  })

  $(".check-box-agree").on("input",function(){
    $(".agree-check-error").text("")
  })

  renderLanguage('../../common/language/');

  if (!canGetPersonalDetails) {
    $("#personalDetailsSection").remove();
    $("#step-personal").remove();
  }
  // if (!canGetPhotos) {
  //   $("#photoUploadSection").remove();
  //   $("#step-photo").remove();
  // }
  // if (!canGetIdDocument) {
  //   $("#documentVerificationSection").remove();
  //   $("#step-document").remove();
  // }

  $(".progress-steps .step").each(function (index) {
    $(this)
      .find(".step-number")
      .text(index + 1);
  });

  setupDragAndDrop($("#photoUpload"), $studentPhotoInput);
  setupDragAndDrop($("#documentUpload"), $studentIdInput);

  $("#photoUpload").on("click", function (e) {
    if ($(e.target).is("input")) return;
    $studentPhotoInput.trigger("click");
  });

  $("#documentUpload").on("click", function (e) {
    if ($(e.target).is("input")) return;
    $studentIdInput.trigger("click");
  });

  $("#browseDocument").on("click", function () {
    $studentIdInput.trigger("click");
  });

  $studentPhotoInput.on("change", function (e) {
    let file = this.files[0];
    let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
    if (file) {
      // Allowed file types for photo upload
      const allowedPhotoTypes = ["image/png", "image/jpeg", "image/webp",'image/jpg'];
      if (!allowedPhotoTypes.includes(file.type)) {
        toastr.error(
        isEnglish ? "Invalid file type for photo upload. Please upload an image in PNG, JPG, JPEG, or WEBP format." : "نوع الملف غير صالح لتحميل الصورة. يرجى رفع صورة بتنسيق PNG أو JPG أو JPEG أو WEBP."
        );
        // Clear the input and reset the preview area
        this.value = "";
        $photoPreview.html(defaultPhotoPreviewHtml);
        return;
      }
      let reader = new FileReader();
      reader.onload = function (e) {
        $photoPreview.html(
          '<img src="' +
            e.target.result +
            '" class="small-preview" alt="Photo Preview">'
        );
      };
      reader.readAsDataURL(file);
    }
  });

$studentIdInput.on("change", function (e) {
  let file = this.files[0];
  let isEnglish = (localStorage.getItem('lang') || 'en') === 'en';

  if (file) {

    // ADD THIS: RENAME FILE SAFELY
    const ext = file.name.split('.').pop();
    const newName = `attachment_${Date.now()}.${ext}`;
    file = new File([file], newName, { type: file.type });

    //Now continue your existing code exactly the same
    $("#doc-preview-container").show(); 
    $("#documentUpload").hide();
    $(".document-upload-session").css("flex-direction","column-reverse");
    $(".document-upload-session").css("gap","1rem");

    const allowedDocTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
      "image/jpg"
    ];

    if (!allowedDocTypes.includes(file.type)) {
      toastr.error(
        isEnglish
          ? "Invalid file type for document upload. Please upload a PDF, PNG, JPG, JPEG, or WEBP file."
          : "نوع الملف غير صالح لتحميل المستند. يرجى رفع ملف بتنسيق PDF أو PNG أو JPG أو JPEG أو WEBP."
      );
      this.value = "";
      $docPreview.html(defaultDocPreviewHtml);
      return;
    }

    if (file.type.startsWith("image/")) {
      let reader = new FileReader();
      reader.onload = function (e) {
        $docPreview.html(
          '<img src="' +
            e.target.result +
            '" class="small-preview" alt="Document Preview">'
        );
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      let fileUrl = URL.createObjectURL(file);
      $docPreview.html(
        '<object data="' +
          fileUrl +
          '" type="application/pdf" width="100%" height="500px">' +
          "  <p>PDF preview is not available in your browser.</p>" +
          "</object>"
      );
    } else if (
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      let fileUrl = URL.createObjectURL(file);
      $docPreview.html(
        "<p>Document File Selected: " +
          file.name +
          '. <a href="' +
          fileUrl +
          '" target="_blank">Open Document</a></p>'
      );
    } else {
      $docPreview.html("<p>File Selected: " + file.name + "</p>");
    }

    //Store the renamed file for upload
    renamedAttachmentFile = file;
  }
});

  $(".preview-box").on("click", function () {
    let content = $(this).html();
    let contentClone = $("<div>").html(content);
    contentClone.find("img").removeClass("small-preview");
    $("#customPreviewPopup .popup-image-container").html(contentClone.html());
    $("#customPreviewPopup").fadeIn();
  });

  $("#customPreviewPopup .popup-close, #customPreviewPopup").on(
    "click",
    function (e) {
      if (e.target === this || $(e.target).closest(".popup-close").length) {
        $("#customPreviewPopup").fadeOut();
      }
    }
  );

  $("#startCamera").on("click", function () {
    $("#cameraPopup").fadeIn();
    initiateCamera();
  });

  $captureBtn.on("click", async function () {
    if (!stream) {
      alert("Camera not started");
      return;
    }
    
    // Use the face validator to check if face is valid
    const validationResult = await import('./face-validation.js').then(module => module.getLastValidationResult());
    let isEnglish = (localStorage.getItem('lang') || 'en') === 'en';
    
    if (!validationResult || !validationResult.valid) {
      // Display validation error message
      const errorMessage = validationResult ? 
        (isEnglish ? validationResult.message : validationResult.messageAr) :
        (isEnglish ? "Face validation failed" : "فشل التحقق من الوجه");
      
      toastr.error(errorMessage);
      return;
    }
    
    canvas.width = $videoElement[0].videoWidth;
    canvas.height = $videoElement[0].videoHeight;
    canvas.getContext("2d").drawImage($videoElement[0], 0, 0);
    let photoData = canvas.toDataURL("image/jpeg");
    $photoPreview.html(
      '<img src="' + photoData + '" class="small-preview" alt="Photo Preview">'
    );
    $("#cameraPopup").fadeOut();
    stopCamera();
  });

  $("#cancelBtn, #cameraPopup .popup-close").on("click", function () {
    $("#cameraPopup").fadeOut();
    stopCamera();
  });

  $form.on("submit", async function (e) {
    e.preventDefault();
    if(formValidation()){
  
    showLoader(true);

    if (canGetPersonalDetails) {
      let firstName = $("#personal_information_fields_first_name_placeholder").val().trim();
      let lastName = $("#personal_information_fields_last_name_placeholder").val().trim();
      let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
      if (!firstName || !lastName) {
        toastr.error(
         isEnglish ?  "Please fill out your personal details (first name and last name)." : "يرجى ملء تفاصيلك الشخصية (الاسم الأول واسم العائلة)."
        );
        showLoader(false);
        return;
      }
    }

    if (canGetPhotos) {
      let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
      if (
        !$studentPhotoInput[0]?.files[0] &&
        $photoPreview.find("img").length === 0
      ) {
        toastr.error(isEnglish?"Please upload or capture your photo.":"يرجى رفع صورتك أو التقاط صورة.");
        showLoader(false);
        return;
      }
    }

    if (canGetIdDocument) {
      let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
      if (!$studentIdInput[0].files[0] && !$docPreview.find("img").length && !$docPreview.find("object").length) {
        toastr.error(isEnglish?"Please upload your ID document.":"يرجى رفع وثيقة هويتك.");
        showLoader(false);
        return;
      }
    }

    let payload = {
      firstName: $("#personal_information_fields_first_name_placeholder").val(),
      lastName: $("#personal_information_fields_last_name_placeholder").val(),
      email: $("#personal_information_fields_email_placeholder").val(),
      status: {
        registration: "REGISTERED",
      },
    };

    const existingFaceImg = $photoPreview.find("img[data-from-api='true']");

    if (existingFaceImg.length) {
      // Skip face upload if image exists from API
    } else if ($studentPhotoInput[0]?.files[0]) {
      let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
      try {
        const uploadResult = await uploadFileForQuestion(attenderId, {
          file: $studentPhotoInput[0].files[0],
        });
        const parts = $studentPhotoInput[0].files[0]?.name?.split(".");
        const baseName =
          parts?.slice(0, parts.length - 1).join(".") || parts[0];
        const extension = parts[parts.length - 1];
        if (uploadResult) {
          payload.face = {
            fileName: baseName,
            fileType: extension,
          };
        }
      } catch (error) {
        toastr.error(isEnglish?"Error uploading student photo":"خطأ في رفع صورة الطالب");
        showLoader(false);
        return;
      }
    } else if ($photoPreview.find("img").length) {
      let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'

      try {
        let base64Data = $photoPreview.find("img").attr("src");
        let response = await fetch(base64Data);
        let blob = await response.blob();
        const fileType = blob.type.split('/').pop();
        let file = new File([blob], `student_image_${attenderId}.${fileType}`, { type: fileType });
        const uploadResult = await uploadFileForQuestion(attenderId, { file });
        if(uploadResult){
          payload.face = {
            fileName: `student_image_${attenderId}`,
            fileType: fileType,
          }
        }
      } catch (error) {
        toastr.error(isEnglish?"Error uploading captured photo":"خطأ في رفع الصورة الملتقطة");
        showLoader(false);
        return;
      }
    }

    const existingDocImg = $docPreview.find("img[data-from-api='true']");

    if (existingDocImg.length) {
    } else if ($studentIdInput[0]?.files[0]) {
      try {
        const uploadResult = await uploadFileForQuestion(attenderId, {
          file: renamedAttachmentFile,
        });
        const parts = renamedAttachmentFile.name.split(".");
        const baseName =
          parts?.slice(0, parts.length - 1).join(".") || parts[0];
        const extension = parts[parts.length - 1];
        if (uploadResult) {
          payload.attachment = {
            fileName: baseName,
            fileType: extension,
          };
        }
      } catch (error) {
        toastr.error(isEnglish?"Error uploading student ID document":"خطأ في رفع وثيقة هوية الطالب");
        showLoader(false);
        return;
      }
    }

    submitStudentRegistration(payload);
  }else{
    let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
    if (!$("#confirmCheckbox").is(":checked")) {
      toastr.warning(isEnglish?"Please confirm that all details provided are true." : "يرجى تأكيد أن جميع التفاصيل المقدمة صحيحة."
    );
    if (!$(".first-name").val() || !$(".last-name").val()) {
      toastr.warning(isEnglish?"Something is Missing" : "هناك شيء مفقود"
    );
  }
    }
  }
  });

$("#clearBtn").on("click", function () {
  let isEnglish = (localStorage.getItem('lang') || 'en') === 'en';
  if (confirm(isEnglish ? "Are you sure you want to clear all fields?" : "هل أنت متأكد أنك تريد مسح جميع الحقول؟")) {
    // Store value of the field you don't want to reset
    const preservedValue = $("#personal_information_fields_email_placeholder").val();
    $form[0].reset();

    $("#personal_information_fields_email_placeholder").val(preservedValue);
    // Reset previews
    $photoPreview.html(defaultPhotoPreviewHtml);
    $docPreview.html(defaultDocPreviewHtml);
  }
});


  $(window).on("beforeunload", function () {
    stopCamera();
  });

  fetchAttenderData(attenderId);
});

// DRAG-AND-DROP SETUP
function setupDragAndDrop($uploadArea, $input) {
  $uploadArea.on("dragover", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).addClass("dragging");
  });
  $uploadArea.on("dragleave", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass("dragging");
  });
  $uploadArea.on("drop", function (e) {
    e.preventDefault();
    e.stopPropagation();
    $(this).removeClass("dragging");
    let files = e.originalEvent.dataTransfer.files;
    if (files.length > 0) {
      // Create a new DataTransfer to assign file(s) to the input
      let dt = new DataTransfer();
      dt.items.add(files[0]);
      $input[0].files = dt.files;
      $input.trigger("change");
    }
  });
}

// Function to stop the camera stream
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(function (track) {
      track.stop();
    });
    stream = null;
  }
  $videoElement.hide();
  
  if (faceValidator) {
    faceValidator.dispose();
    faceValidator = null;
  }
}

// Function to start the camera and display the preview inside the dialog
async function initiateCamera() {
  let isEnglish = (localStorage.getItem('lang') || 'en') === 'en';

  try {
  
    try {
      const faceValidationModule = await import('./face-validation.js');
      faceValidator = await faceValidationModule.initFaceValidation();
      
      
      toastr.info(isEnglish ? "Preparing camera and face detection..." : "جارٍ تحضير الكاميرا والتعرف على الوجه...");
      
      
      toastr.success(isEnglish ? "Face detection ready" : "الكشف عن الوجه جاهز");
    } catch (importError) {
      console.error("Error initializing face validation:", importError);
      toastr.error(
        isEnglish ? "Failed to load face detection module. Please try again or use file upload." : 
        "فشل في تحميل وحدة التعرف على الوجه. يرجى المحاولة مرة أخرى أو استخدام تحميل الملف."
      );
      return;
    }
    
    // Get camera stream
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(function (myStream) {
        stream = myStream;
        let videoElem = $videoElement[0];
        videoElem.srcObject = stream;
        $videoElement.show();
        $captureBtn.show();
        
        // Create UI elements for face validation
        const container = document.querySelector('.camera-instructions');
        faceValidator.createUI(container, videoElem, $captureBtn[0]);
        
        // Start the live validation process
        faceValidator.startLiveValidation(videoElem, $captureBtn[0]);
      })
      .catch(function (err) {
        toastr.error(
         isEnglish ? "Unable to access camera. Please ensure you have granted camera permissions." : "غير قادر على الوصول إلى الكاميرا. يرجى التأكد من أنك قد منحت الأذونات اللازمة للكاميرا."
        );
      });
  } catch (error) {
    console.error("Error initializing camera and face detection:", error);
    toastr.error(
      isEnglish ? "Error initializing camera. Please try again or use file upload." : "خطأ في تهيئة الكاميرا. يرجى المحاولة مرة أخرى أو استخدام تحميل الملف."
    );
  }
}

//submet student response
function submitStudentRegistration(payload) {
  let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
  if (!attenderId) {
    toastr.success(isEnglish?"Student id is required!":"رقم هوية الطالب مطلوب!");
    return;
  }
  $.ajax({
    url: `${DOMAIN_URL}/v1/attender?id=${attenderId}&email=${payload.email}`,
    type: "PUT",
    data: JSON.stringify(payload),
    contentType: "application/json",
    headers: apiHeaders,
    success: function () {
      toastr.success(isEnglish?"Registration successful!":"تم التسجيل بنجاح!");
      $form[0].reset();
      $photoPreview.html(defaultPhotoPreviewHtml);
      $docPreview.html(defaultDocPreviewHtml);
      showLoader(false);
      setTimeout(function () {
        window.location.href = "registration-success.html?cid="+collegeCode;
      }, 2000);
    },
    error: function () {
      toastr.error(isEnglish?"An error occurred during registration. Please try again.":"حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
      showLoader(false);
    },
  });
}

// Fetch data based on attenderId
function fetchAttenderData(attenderId) {
  let isEnglish = (localStorage.getItem('lang') || 'en') === 'en'
  showLoader(true);
  $.ajax({
    url: `${ATTENDER_END_POINT}?id=${attenderId}`,
    type: "GET",
    contentType: "application/json",
    headers: apiHeaders,
    success: function (data) {
      if (data.data?.status?.registration === APPROVED) {
        $form.find("input, select, textarea").prop("disabled", true);
        $("#startCamera").prop("disabled", true);
        $("#photoUpload").off("click");
        $("#browseDocument").off("click");
        $("#confirmCheckbox").prop("disabled", true);
        $(".submit-btn").prop("disabled", true);
      }

      $("#personal_information_fields_first_name_placeholder").val(data.data?.name?.first);
      $("#personal_information_fields_last_name_placeholder").val(data.data?.name?.last);
      $("#personal_information_fields_email_placeholder").val(data.data?.email);

      if (data.data?.face && data.data?.face.length > 0) {
        $photoPreview.html(
          `<img src="${data.data.face[0]}" 
               class="small-preview" 
               alt="Photo Preview"
               data-from-api="true">`
        );
      }
      if (data.data?.attachments && data.data?.attachments?.length > 0) {
        $("#doc-preview-container").show();
        $("#documentUpload").hide();
        $(".document-upload-session").css("flex-direction", "column-reverse");
        $(".document-upload-session").css("gap", "1rem");

        let fileUrl = data.data.attachments[0];

        // Remove query string for type detection
        const cleanUrl = fileUrl.split("?")[0].toLowerCase();

        if (cleanUrl.endsWith(".pdf")) {
          // PDF preview
          $docPreview.html(`
      <object data="${fileUrl}" type="application/pdf" width="100%" height="500px">
        <p>PDF preview not available. <a href="${fileUrl}" target="_blank">Open PDF</a></p>
      </object>
    `);
        } else if (cleanUrl.match(/\.(jpg|jpeg|png|webp)$/)) {
          // Image preview
          $docPreview.html(`
      <img src="${fileUrl}" 
           class="small-preview" 
           alt="Document Preview"
           data-from-api="true"
           onerror="this.onerror=null;this.outerHTML='<p>Image failed to load. <a href=${fileUrl} target=_blank>Open File</a></p>';">
    `);
        }
      }

      if (!data?.data?.enableUploadDocuments) $("#documentVerificationSection").remove()
      if (!data?.data?.enableCaptureImage) $("#photoUploadSection").remove();
      if (data?.data?.enableCaptureImage || data?.data?.enableUploadImage) {
        if (data?.data?.enableCaptureImage && !data?.data?.enableUploadImage) {
          canGetPhotos = data?.data?.enableCaptureImage;
          $("#files-container").remove()
          $('#photoUpload').remove()
        } else if (data?.data?.enableUploadImage && !data?.data?.enableCaptureImage) {
          canGetPhotos = data?.data?.enableCaptureImage;
          $('#startCamera').remove()
        } else {
          canGetPhotos = data?.data?.enableCaptureImage;
        }
      } else {
        $("#step-photo").remove();
      }
      collegeCode = data?.data?.code;
      if (data?.data?.enableUploadDocuments) {
        canGetIdDocument = data?.data?.enableUploadDocuments;
      } else {
        $("#documentVerificationSection").remove();
        $("#step-document").remove();
      }

      showLoader(false);
    },
    error: function () {
      showLoader(false);
      toastr.error(isEnglish ? "Error fetching attender data" : "خطأ في جلب بيانات الحضور");
    },
  });
}

function formValidation(){
  let isVerified = true
  const data_types = [undefined,null,'',false];
  const data = [
    {value: $(".first-name").val(),key:".first-name-error",key2:".first-name",message:"First Name Is Required"},
    {value: $(".last-name").val(),key:".last-name-error",key2:".last-name",message:"Last Name Is Required"},
    {value: $(".check-box-agree").prop("checked"),key:".agree-check-error",key2:".agree-check",message:"Agree Is Required"}
  ]
  data.forEach((value)=>{
    if(data_types.includes(value.value)) {
      $(value.key).text(value.message).css({fontSize:"13px",marginTop:"5px",color:"red"})
      if(value.key2 === ".agree-check"){
         $(value.key2).addClass('check-box-style')
      }else{
        $(value.key2).css({border:"2px solid red",accentColor:'red'})
      }
      isVerified = false
    }else {
      if (value.key2 === ".agree-check") {
        $(value.key2).removeClass('check-box-style');
      } else {
        $(value.key2).css({border: "", accentColor: ''});  
      }
      $(value.key).text(""); 
    }
  })
return isVerified
}