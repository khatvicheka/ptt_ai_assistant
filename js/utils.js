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


// Close modal
function closeAboutModal() {
  aboutModal.classList.add("hidden");
  aboutModal.classList.remove("show");
  document.body.style.overflow = "auto"; // Restore scrolling
}