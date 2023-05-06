import multer from "multer";
import path from "path";
import fs from "fs"
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const destinationPath = path.resolve(__dirname, "../public");
    fs.mkdir(destinationPath, { recursive: true }, (err) => {
      if (err) throw err;
      cb(null, destinationPath);
    });
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}${ext}`);
  },
});

export const uploadImage = multer({ storage: storage });
