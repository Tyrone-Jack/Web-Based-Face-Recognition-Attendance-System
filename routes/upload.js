const express = require("express");
const multer = require("multer");
const fs = require('fs-extra');
const path = require("path");
const router = express.Router();

const projectRoot = path.resolve(__dirname, '..'); // goes to main project folder


console.log("Root Directory is:", projectRoot);
// Ensure directory exists
const folderPath = path.join(
  __dirname,
  "..",
  "images",
  "Course",
  "BCT 2022",
  "Unit001",
  "attendees"
);
fs.mkdirSync(folderPath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");

    //Replaced with real info after recognition
    const regNo = "CT123456";
    const name = "JohnDoe";

    cb(null, `${regNo}_${name}_${date}_${time}.png`);
  },
});
const upload = multer({ storage: multer.memoryStorage() });

router.post('/register', upload.array('images', 3), async (req, res) => {
  try {
    const { name, regNo, course, year, folder } = req.body;

    if (!name || !regNo || !course || !year || !req.files || req.files.length !== 3) {
      return res.status(400).json({ message: 'All fields and 3 face images are required.' });
    }

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9-_ ]/g, '_');
    const saveDir = path.join(projectRoot, 'public', 'faces', 'BCT 2022', sanitizedFolder);

    await fs.ensureDir(saveDir); //Corrected from savePath

    // Save images as image1.png, image2.png, image3.png
    await Promise.all(req.files.map((file, index) => {
      const filename = `image${index + 1}.png`;
      return fs.writeFile(path.join(saveDir, filename), file.buffer); //Uses saveDir
    }));

    console.log(`User ${regNo} - ${name} registered successfully in ${saveDir}`);

    return res.status(200).json({ message: 'User registered and images saved. Saving images to:', saveDir });
    //return res.status(200).json({message:"Saving images to:", saveDir});

  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ message: 'Server error during registration.' });
  }

 
});
router.get('/labels', (req, res) => {
  const facesPath = path.join(projectRoot, 'public', 'faces', 'BCT 2022');

  fs.readdir(facesPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      console.error('Error reading face folders:', err);
      return res.status(500).json({ error: 'Failed to load labels' });
    }

    const labels = files
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    res.json(labels);
  });
});

module.exports = router;
