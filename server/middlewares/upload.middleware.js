
const multer = require("multer");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG and WEBP images are allowed."));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

// University ID Card Upload
const uploadIdCard = (req, res, next) => {
  upload.single("idCard")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Image size must not exceed 5 MB."
            : err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    next();
  });
};

// Profile Picture Upload
const uploadProfileImage = (req, res, next) => {
  upload.single("profileImage")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Profile picture must not exceed 5 MB."
            : err.message,
      });
    }

    if (err) {
      return res.status(400).json({
        message: err.message,
      });
    }

    next();
  });
};

module.exports = {
  uploadIdCard,
  uploadProfileImage,
};
