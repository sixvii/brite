const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function makeUploader() {
  const storage = multer.memoryStorage();
  return multer({
    storage,
    limits: {
      fileSize: 30 * 1024 * 1024
    }
  });
}

async function uploadToCloudinary(file, folder) {
  if (!file) return null;
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder,
    resource_type: "image"
  });

  return result.secure_url;
}

module.exports = {
  makeUploader,
  uploadToCloudinary
};
