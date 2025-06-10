// Gemini API Configuration
const API_KEY = "AIzaSyCkbFH8Ah9f5rSyOmZcjR1gSHkNNL7YLAA";
let currentSlideIndex = 0;
let allSlides = [];
let isPPTGenerated = false;

// DOM Elements
const editor = document.getElementById("editor");
const previewContainer = document.getElementById("preview-container");
const imageInput = document.getElementById("image-input");
const imageProcessBtn = document.getElementById("image-process-btn");
const audioBtn = document.getElementById("audio-btn");
const audioIcon = document.getElementById("audio-icon");
const audioText = document.getElementById("audio-text");
const audioStatus = document.getElementById("audio-status");
const spellCheckBtn = document.getElementById("spell-check-btn");
const downloadBtn = document.getElementById("download-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const notification = document.getElementById("notification");
const clearBtn = document.getElementById("clear-btn");

// Speech Recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let isRecording = false;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "km-KH";
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        audioStatus.textContent =
          "កំពុងស្តាប់... " + event.results[i][0].transcript;
      }
    }
    // if (finalTranscript) {
    //   editor.value += finalTranscript.trim() + "\n\n";
    //   //   updatePreview();
    // }
  };

  recognition.onstart = () => {
    isRecording = true;
    audioStatus.textContent = "កំពុងស្តាប់...";
    audioIcon.classList.add("fa-beat-fade");
    audioText.textContent = "បញ្ឈប់ការថត";
    audioBtn.classList.remove("bg-red-500");
    audioBtn.classList.add("bg-gray-700");
  };
  recognition.onend = () => {
    isRecording = false;
    audioStatus.textContent = "";
    audioIcon.classList.remove("fa-beat-fade");
    audioText.textContent = "ចាប់ផ្តើមថតសំឡេង";
    audioBtn.classList.add("bg-red-500");
    audioBtn.classList.remove("bg-gray-700");
  };
  recognition.onerror = (event) => {
    console.error("Speech recognition error", event.error);
    showNotification(`មានបញ្ហាជាមួយការថតសំឡេង៖ ${event.error}`, "error");
  };
} else {
  audioBtn.disabled = true;
  audioBtn.innerHTML =
    '<i class="fas fa-exclamation-triangle mr-2"></i>កម្មវិធីរុករកមិនគាំទ្រ';
}

// --- Event Listeners ---

const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    tabContents.forEach((content) => {
      content.classList.remove("active");
      if (content.id === `tab-${target}`) content.classList.add("active");
    });
  });
});

editor.addEventListener("input", updatePreview);

imageProcessBtn.addEventListener("click", async () => {
  if (!imageInput.files || imageInput.files.length === 0) {
    showNotification("សូមជ្រើសរើសរូបភាពជាមុនសិន", "error");
    return;
  }
  const file = imageInput.files[0];
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1];
    showLoading("កំពុងទាញយកអត្ថបទពីរូបភាព...");
    try {
      const text = await getTextFromImage(base64Image);
      editor.value = text;
      //   updatePreview();
      showNotification("ទាញយកអត្ថបទពីរូបភាពបានជោគជ័យ!", "success");
    } catch (error) {
      console.error("Error getting text from image:", error);
      showNotification(
        "មានបញ្ហាក្នុងការទាញយកអត្ថបទ។ សូមព្យាយាមម្តងទៀត។",
        "error"
      );
    } finally {
      hideLoading();
    }
  };
});

audioBtn.addEventListener("click", () => {
  if (!recognition) return;
  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

spellCheckBtn.addEventListener("click", async () => {
  const text = editor.value.trim();
  if (!text) {
    showNotification("សូមបញ្ចូលអត្ថបទសម្រាប់បង្កើត PPT", "error");
    return;
  }
  showLoading("AI កំពុងបង្កើត PPT...");
  try {
    const pptContent = await generatePPT(text);
    editor.value = pptContent.trim();
    isPPTGenerated = true;
    currentSlideIndex = 0;
    updatePreview();
    showNotification("បង្កើត PPT បានជោគជ័យ!", "success");
  } catch (error) {
    console.error("Error generating PPT:", error);
    showNotification("មានបញ្ហាក្នុងការបង្កើត PPT", "error");
  } finally {
    hideLoading();
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("តើអ្នកពិតជាចង់សម្អាតអត្ថបទទាំងអស់មែនទេ?")) {
    editor.value = "";
    textInput.value = "";
    isPPTGenerated = false;
    currentSlideIndex = 0;
    allSlides = [];
    updatePreview();
    showNotification("សម្អាតអត្ថបទរួចរាល់!", "success");
  }
});

function updatePreview() {
  // Only show basic text preview, no slides until PPT is generated
  const text = editor.value;
  previewContainer.innerHTML = "";

  if (!isPPTGenerated) {
    if (text.trim()) {
      previewContainer.innerHTML = `
        <div class="text-center text-gray-500 py-16">
          <i class="fas fa-info-circle text-4xl mb-4"></i>
          <p>សូមចុចប៊ូតុង "បង្កើត PPT" ដើម្បីមើលស្លាយ</p>
        </div>`;
    } else {
      previewContainer.innerHTML = `
        <p class="text-center text-gray-500 py-16">
          ផ្ទាំងមើលស្លាយនឹងបង្ហាញនៅទីនេះ...
        </p>`;
    }
    return;
  }

  updateSlidePreview();
}

function updateSlidePreview() {
  const text = editor.value;
  const linesPerSlide = parseInt(
    document.getElementById("lines-per-slide").value
  );
  const backgroundColor = document.getElementById("bg-color").value;
  const textColor = document.getElementById("text-color").value;
  const fontSize = document.getElementById("font-size").value;

  // Split text into slides based on lines per slide setting
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  allSlides = [];

  for (let i = 0; i < lines.length; i += linesPerSlide) {
    const slideLines = lines.slice(i, i + linesPerSlide);
    allSlides.push(slideLines.join("\n"));
  }

  if (currentSlideIndex >= allSlides.length) {
    currentSlideIndex = 0;
  }

  displayCurrentSlide(backgroundColor, textColor, fontSize);
}

function displayCurrentSlide(backgroundColor, textColor, fontSize) {
  previewContainer.innerHTML = "";
  const lineSpacing = document.getElementById("line-spacing")?.value || "1.5";

  if (allSlides.length === 0) {
    previewContainer.innerHTML = `
      <div class="text-center text-gray-500 py-16">
        <p>គ្មានស្លាយសម្រាប់បង្ហាញ</p>
      </div>`;
    return;
  }

  const slideWrapper = document.createElement("div");
  slideWrapper.className = "relative";

  // Slide content
  const slideDiv = document.createElement("div");
  slideDiv.className = "slide-preview";
  slideDiv.style.backgroundColor = backgroundColor;
  slideDiv.style.color = textColor;
  slideDiv.style.fontSize = fontSize;
  slideDiv.style.lineHeight = lineSpacing;
  slideDiv.textContent = allSlides[currentSlideIndex].trim();

  // Navigation controls
  const navWrapper = document.createElement("div");
  navWrapper.className = "flex justify-between items-center mt-4";

  const prevBtn = document.createElement("button");
  prevBtn.className =
    "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 disabled:bg-gray-300";
  prevBtn.innerHTML = '<i class="fas fa-chevron-left mr-2"></i>មុន';
  prevBtn.disabled = currentSlideIndex === 0;
  prevBtn.addEventListener("click", () => {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      displayCurrentSlide(backgroundColor, textColor, fontSize);
    }
  });

  const slideInfo = document.createElement("div");
  slideInfo.className = "text-center";
  slideInfo.innerHTML = `<span class="text-gray-600">ស្លាយ ${
    currentSlideIndex + 1
  } ក្នុងចំណោម ${allSlides.length}</span>`;

  const nextBtn = document.createElement("button");
  nextBtn.className =
    "bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-300 disabled:bg-gray-300";
  nextBtn.innerHTML = 'បន្ទាប់<i class="fas fa-chevron-right ml-2"></i>';
  nextBtn.disabled = currentSlideIndex === allSlides.length - 1;
  nextBtn.addEventListener("click", () => {
    if (currentSlideIndex < allSlides.length - 1) {
      currentSlideIndex++;
      displayCurrentSlide(backgroundColor, textColor, fontSize);
    }
  });

  navWrapper.appendChild(prevBtn);
  navWrapper.appendChild(slideInfo);
  navWrapper.appendChild(nextBtn);

  slideWrapper.appendChild(slideDiv);
  slideWrapper.appendChild(navWrapper);
  previewContainer.appendChild(slideWrapper);
}

// Toggle Customization Section - Hidden by default
const toggleCustomization = document.getElementById("toggle-customization");
const customizationSection = document.getElementById("customization-section");
const toggleIcon = document.getElementById("toggle-icon");
const toggleText = document.getElementById("toggle-text");

let isCustomizationVisible = false; // Changed to false (hidden by default)

toggleCustomization.addEventListener("click", () => {
  isCustomizationVisible = !isCustomizationVisible;

  if (isCustomizationVisible) {
    customizationSection.classList.remove("collapsed");
    toggleIcon.classList.replace("fa-chevron-down", "fa-chevron-up");
    toggleText.textContent = "លាក់";
  } else {
    customizationSection.classList.add("collapsed");
    toggleIcon.classList.replace("fa-chevron-up", "fa-chevron-down");
    toggleText.textContent = "បង្ហាញ";
  }
});

// Add event listeners for customization controls
// Add event listeners with null checks
const bgColorEl = document.getElementById("bg-color");
const textColorEl = document.getElementById("text-color");
const fontSizeEl = document.getElementById("font-size");
const linesPerSlideEl = document.getElementById("lines-per-slide");
const lineSpacingEl = document.getElementById("line-spacing");

if (bgColorEl)
  bgColorEl.addEventListener("change", () => {
    if (isPPTGenerated) updateSlidePreview();
  });
if (textColorEl)
  textColorEl.addEventListener("change", () => {
    if (isPPTGenerated) updateSlidePreview();
  });
if (fontSizeEl)
  fontSizeEl.addEventListener("change", () => {
    if (isPPTGenerated) updateSlidePreview();
  });
if (linesPerSlideEl)
  linesPerSlideEl.addEventListener("change", () => {
    if (isPPTGenerated) updateSlidePreview();
  });
if (lineSpacingEl)
  lineSpacingEl.addEventListener("change", () => {
    if (isPPTGenerated) updateSlidePreview();
  });

downloadBtn.addEventListener("click", async () => {
  const textToSave = editor.value;
  if (!textToSave.trim()) {
    showNotification("គ្មានអត្ថបទសម្រាប់ទាញយកទេ!", "error");
    return;
  }

  showLoading("កំពុងបង្កើតឯកសារ PowerPoint...");

  try {
    // Get customization settings
    const lineSpacing = document.getElementById("line-spacing")?.value || "1.5";
    const backgroundColor = document.getElementById("bg-color").value;
    const textColor = document.getElementById("text-color").value;
    const fontSize =
      parseInt(document.getElementById("font-size").value.replace("rem", "")) *
      16; // Convert rem to px
    const linesPerSlide = parseInt(
      document.getElementById("lines-per-slide").value
    );

    // Create new presentation
    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";

    // Split text into slides
    const lines = textToSave.split("\n").filter((line) => line.trim() !== "");
    const slides = [];

    for (let i = 0; i < lines.length; i += linesPerSlide) {
      const slideLines = lines.slice(i, i + linesPerSlide);
      slides.push(slideLines.join("\n"));
    }

    // Add slides to presentation
    slides.forEach((slideContent, index) => {
      const slide = pres.addSlide();

      // Set slide background
      slide.background = { color: backgroundColor.replace("#", "") };

      // Add text to slide
      slide.addText(slideContent.trim(), {
        x: 0.5,
        y: 1,
        w: 9,
        h: 4.5,
        // fontSize: Math.round(fontSize * 0.75), // Convert to PowerPoint font size
        fontSize: parseInt(document.getElementById("ppt-font-size").value),
        color: textColor.replace("#", ""),
        align: "center",
        valign: "middle",
        // fontFace: "Khmer UI",
        fontFace: document.getElementById("font-family").value,
        lineSpacing: Math.round(parseFloat(lineSpacing) * 20), // Convert to PowerPoint line spacing
        // lineSpacing: 32,
        wrap: true,
      });
    });

    // Save the presentation
    await pres.writeFile({ fileName: "worship_presentation.pptx" });
    showNotification("ទាញយក PowerPoint បានជោគជ័យ!", "success");
  } catch (error) {
    console.error("Error creating PowerPoint:", error);
    showNotification("មានបញ្ហាក្នុងការបង្កើត PowerPoint។", "error");
  } finally {
    hideLoading();
  }
});

// --- Core Functions ---

async function callGeminiAPI(prompt, base64Image = null) {
  const model = "gemini-2.0-flash";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

  let parts = [{ text: prompt }];
  if (base64Image) {
    parts.push({
      inlineData: { mimeType: "image/jpeg", data: base64Image },
    });
  }

  const payload = { contents: [{ parts: parts }] };

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API Error: ${response.status} ${response.statusText}\n${errorBody}`
    );
  }

  const result = await response.json();
  if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
    return result.candidates[0].content.parts[0].text;
  } else {
    throw new Error("API response was empty or invalid.");
  }
}

async function getTextFromImage(base64ImageData) {
  const prompt = `សូមវិភាគរូបភាពនេះ៖

    បើរូបភាពនេះមាន៖
    - អក្សរខ្មែរ៖ ទាញយកអត្ថបទជាភាសាខ្មែរទាំងអស់
    - តន្ត្រី/ផ្ទាំងចម្រៀង៖ ទាញយកតែពាក្យចម្រៀងជាភាសាខ្មែរ (មិនរាប់បញ្ចូលកូដតន្ត្រី A, B, C, D, E, F, G ឬលេខផ្សេងៗ)
    - ទាំងតន្ត្រីទាំងអត្ថបទ៖ ទាញយកតែអត្ថបទភាសាខ្មែរ

    គោលការណ៍៖
    - រក្សាទម្រង់ចុះបន្ទាត់ដូចក្នុងរូបភាព
    - ទាញយកតែពាក្យ/អត្ថបទភាសាខ្មែរ
    - មិនរាប់បញ្ចូលកូដតន្ត្រី, លេខ, ឬសញ្ញាតន្ត្រីទេ
    - បើគ្មានអក្សរខ្មែរ ឆ្លើយ "រកមិនឃើញអក្សរខ្មែរ"`;

  return await callGeminiAPI(prompt, base64ImageData);
}

async function generatePPT(text) {
  const prompt = `អ្នកគឺជាអ្នកជំនាញក្នុងការរៀបចំ PowerPoint ចម្រៀងនិងបទគម្ពីរ។ សូមរៀបចំអត្ថបទខាងក្រោមនេះឲ្យក្លាយជាទម្រង់ PPT ដែលអាចប្រើបានភ្លាម។ 

    គោលការណ៍ណែនាំ៖
    - បំបែកអត្ថបទជាស្លាយតូចៗ (មួយស្លាយមួយខ្សែបទ ឬ២-៣ខ្សែ)
    - រៀបចំឲ្យងាយស្រួលអាន
    - ប្រើការដកឃ្លាពីរដងសម្រាប់បំបែកស្លាយ
    - រក្សាអត្ថន័យដើម
    - ធ្វើឲ្យសមរម្យសម្រាប់បង្ហាញក្នុងព្រះវិហារ
    - កុំបន្ថែមលេខស្លាយ (ស្លាយទី១, ស្លាយទី២) ទេ
    - ឆ្លើយតែអត្ថបទដែលបានរៀបចំប៉ុណ្ណោះ

    អត្ថបទដើម៖
    ---
    ${text}`;

  return await callGeminiAPI(prompt);
}

// async function getSpellCheck(text) {
//   const prompt = `អ្នកគឺជាអ្នកជំនាញភាសាខ្មែរ។ សូមពិនិត្យ និងកែតម្រូវអក្ខរាវិរុទ្ធ រួមទាំងដកឃ្លាផងដែរ នៅក្នុងអត្ថបទខាងក្រោមនេះ។ សំខាន់ណាស់៖ សូមរក្សាទម្រង់ដើមរបស់អត្ថបទ (ការចុះបន្ទាត់ និងការដកឃ្លាចន្លោះស្លាយ) ឲ្យបានពិតប្រាកដ។ ឆ្លើយតែអត្ថបទដែលបានកែរួចប៉ុណ្ណោះ។\n\nអត្ថបទសម្រាប់ពិនិត្យ៖\n---\n${text}`;
//   return await callGeminiAPI(prompt);
// }

function showLoading(message) {
  loadingText.textContent = message;
  loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

let notificationTimeout;
function showNotification(message, type = "error") {
  notification.textContent = message;
  notification.className = ""; // Clear classes
  notification.classList.add("show", type);

  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notification.classList.remove("show");
  }, 3000); // Hide after 3 seconds
}

// About Modal Functionality
const aboutBtn = document.getElementById("about-btn");
const aboutModal = document.getElementById("about-modal");
const closeAbout = document.getElementById("close-about");

// Show modal
aboutBtn.addEventListener("click", () => {
  aboutModal.classList.remove("hidden");
  aboutModal.classList.add("show");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
});

// Close modal
function closeAboutModal() {
  aboutModal.classList.add("hidden");
  aboutModal.classList.remove("show");
  document.body.style.overflow = "auto"; // Restore scrolling
}

closeAbout.addEventListener("click", closeAboutModal);

// Close when clicking outside modal
aboutModal.addEventListener("click", (e) => {
  if (e.target === aboutModal) {
    closeAboutModal();
  }
});

// Close with Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && aboutModal.classList.contains("show")) {
    closeAboutModal();
  }
});
