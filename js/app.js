//variables
let currentSlideIndex = 0;
let allSlides = [];
let isPPTGenerated = false;
let isCustomizationVisible = false;

// DOM Elements
const editor = document.getElementById("editor");
const previewContainer = document.getElementById("preview-container");
const imageInput = document.getElementById("image-input");
const imageProcessBtn = document.getElementById("image-process-btn");
const audioBtn = document.getElementById("audio-btn");
const audioIcon = document.getElementById("audio-icon");
const audioText = document.getElementById("audio-text");
const audioStatus = document.getElementById("audio-status");
const createPPTBtn = document.getElementById("create-ppt-btn");
const downloadBtn = document.getElementById("download-btn");
const loadingOverlay = document.getElementById("loading-overlay");
const loadingText = document.getElementById("loading-text");
const notification = document.getElementById("notification");
const clearBtn = document.getElementById("clear-btn");
const aiSearchBtn = document.getElementById("ai-search-btn");
const bibleInput = document.getElementById("bible-input");
const songInput = document.getElementById("song-input");
const bibleVersion = document.getElementById("bible-version");
const bibleExampleBtn = document.getElementById("bible-example-btn");
const songExampleBtn = document.getElementById("song-example-btn");
const toggleCustomization = document.getElementById("toggle-customization");
const customizationSection = document.getElementById("customization-section");
const toggleIcon = document.getElementById("toggle-icon");
const toggleText = document.getElementById("toggle-text");
const bgColorEl = document.getElementById("bg-color");
const textColorEl = document.getElementById("text-color");
const fontSizeEl = document.getElementById("font-size");
const linesPerSlideEl = document.getElementById("lines-per-slide");
const lineSpacingEl = document.getElementById("line-spacing");
const tabs = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
// About Modal Functionality
const aboutBtn = document.getElementById("about-btn");
const aboutModal = document.getElementById("about-modal");
const closeAbout = document.getElementById("close-about");

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

createPPTBtn.addEventListener("click", async () => {
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

bibleExampleBtn.addEventListener("click", () => {
  const examples = [
    "យ៉ូហាន ៣:១៦",
    "ទំនុកតម្កិត្តិ ២៣",
    "មត្ថេវ ៥:៣-១២",
    "១ កូរិនថូស ១៣",
    "ភីលីព ៤:១៣",
  ];
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  bibleInput.value = randomExample;
});

songExampleBtn.addEventListener("click", () => {
  const examples = [
    "ចម្រៀងរៀងរាយ",
    "ចម្រៀងប្រពៃណីខ្មែរ",
    "ចម្រៀងបុណ្យភ្ជុំបិណ្ឌ",
    "ចម្រៀងបុណ្យចូលឆ្នាំ",
    "ចម្រៀងអរព្រះគុណ",
  ];
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  songInput.value = randomExample;
});

aiSearchBtn.addEventListener("click", async () => {
  const bibleQuery = bibleInput.value.trim();
  const songQuery = songInput.value.trim();
  const selectedVersion = bibleVersion.value;

  if (!bibleQuery && !songQuery) {
    showNotification("សូមបញ្ចូលសំណើរបស់អ្នក", "error");
    return;
  }

  showLoading("AI កំពុងស្វែងរក...");

  try {
    let result = "";

    if (bibleQuery) {
      result += await searchBibleVerse(bibleQuery, selectedVersion);
    }

    if (songQuery) {
      if (result) result += "\n\n";
      result += await searchKhmerSong(songQuery);
    }

    editor.value = result;
    showNotification("AI បានរកឃើញហើយ!", "success");
  } catch (error) {
    console.error("Error in AI search:", error);
    showNotification("មានបញ្ហាក្នុងការស្វែងរក", "error");
  } finally {
    hideLoading();
  }
});

clearBtn.addEventListener("click", () => {
  if (confirm("តើអ្នកពិតជាចង់សម្អាតអត្ថបទទាំងអស់មែនទេ?")) {
    editor.value = "";
    textInput.value = "";
    bibleInput.value = "";
    songInput.value = "";
    isPPTGenerated = false;
    currentSlideIndex = 0;
    allSlides = [];
    updatePreview();
    showNotification("សម្អាតអត្ថបទរួចរាល់!", "success");
  }
});

// Toggle Customization Section - Hidden by default

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

// Show modal
aboutBtn.addEventListener("click", () => {
  aboutModal.classList.remove("hidden");
  aboutModal.classList.add("show");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
});

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
// --- End Event Listeners ---
