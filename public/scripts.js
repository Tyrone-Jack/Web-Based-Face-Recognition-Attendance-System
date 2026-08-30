const run = async () => {
  //Webcam stream
  const video = document.getElementById("video");
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => (video.srcObject = stream))
    .catch((err) => console.error("Webcam error:", err));

    let labels = [];
    const attendanceLog = [];

  function addToAttendanceLog(name) {
    const now = new Date();
    const entry = {
      name: name,
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString(),
    };

    // Prevent duplicates by name
    if (!attendanceLog.some((a) => a.name === name)) {
      attendanceLog.push(entry);
    }
  }

  function generateStyledPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    doc.setFontSize(18);
    doc.text("Attendance Report", 14, 20);
  
    doc.setFontSize(12);
    doc.text("Reg No", 14, 40);
    doc.text("Name", 60, 40);
    doc.text("Attendance", 150, 40);
    doc.line(14, 42, 200, 42); // underline header

    

  
    let y = 50;
  
    labels.forEach((label) => {
      const parts = label.split(" ");
      const regNo = parts[0];
      const cleanedName = parts.slice(1).join(" ");
    
      const isPresent = attendanceLog.some((a) => a.name === label);
    
      doc.text(regNo, 14, y);
      doc.text(cleanedName, 60, y);
      doc.text(isPresent ? "Present" : "Absent", 150, y);
      y += 10;
    });
    
    
    doc.save(`Attendance_Report_${new Date().toLocaleDateString().replace(/\//g, "-")}.pdf`);
  }
  
  document.getElementById("downloadPDF").addEventListener("click", generateStyledPDF);

  function exportCSV() {
    const headers = ["Name", "Date", "Time"];
    const rows = attendanceLog.map((a) => [a.name, a.date, a.time]);

    let csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance_log.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const faceImg = document.getElementById("face");
  const captureBtn = document.getElementById("capture");

  captureBtn.addEventListener("click", () => {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob
    canvas.toBlob((blob) => {
      const objectURL = URL.createObjectURL(blob);
      faceImg.src = objectURL; // replace right-side image

      // Optional: if you want to save too
      const formData = new FormData();
      formData.append("image", blob, "attendee.png");

      fetch("/upload", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Uploaded and recognized:", data);
        });
    }, "image/png");
  });

  // OPTIONAL: Run recognition automatically when the face image change
  faceImg.onload = async () => {
    console.log("New face loaded, triggering recognition...");

    // Wait a moment to ensure the image is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Load models
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri("./models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("./models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("./models"),
      faceapi.nets.tinyFaceDetector.loadFromUri("./models"),
    ]);

    // Load image and detect
    const face1 = document.getElementById("face");
    let faceAIData = await faceapi
      .detectAllFaces(face1)
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Set up canvas
    const canvas = document.getElementById("canvas");
    canvas.style.left = face1.offsetLeft + "px";
    canvas.style.top = face1.offsetTop + "px";
    canvas.width = face1.width;
    canvas.height = face1.height;

    // Resize and draw detections
    faceAIData = faceapi.resizeResults(faceAIData, face1);
    faceapi.draw.drawDetections(canvas, faceAIData);

    // Load known faces
    async function loadLabeledImages() {
      try {
        const res = await fetch('/labels');
        labels = await res.json();
        console.log("Parsed labels:", labels);
    
        return Promise.all(
          labels.map(async (label) => {
            const descriptions = [];
            for (let i = 1; i <= 3; i++) {
              try {
                const img = await faceapi.fetchImage(`/faces/BCT 2022/${label}/image${i}.png`);
                const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                if (!detection) {
                  console.warn(`No face found for ${label} image${i}`);
                  continue;
                }
                descriptions.push(detection.descriptor);
              } catch (err) {
                console.warn(`Failed to load image${i}.png for ${label}:`, err);
              }
            }
            
    
            return new faceapi.LabeledFaceDescriptors(label, descriptions);
          })
        );
      } catch (err) {
        console.error("Could not load labels:", err);
        return [];
      }
    }
    
    // Match face with known labels
    const labeledDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    faceAIData.forEach((fd) => {
      const bestMatch = faceMatcher.findBestMatch(fd.descriptor);
      console.log("✅ Match result:", bestMatch.toString());

      addToAttendanceLog(bestMatch.label);

      const box = fd.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: bestMatch.toString(),
      });
      drawBox.draw(canvas);
    });
  };

  document.getElementById("downloadCSV").addEventListener("click", exportCSV);
  document.getElementById("downloadPDF").addEventListener("click", generateStyledPDF);
};
run();
