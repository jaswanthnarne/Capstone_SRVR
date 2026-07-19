require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadLogos() {
  const logos = [
    { file: path.join(__dirname, '..', '..', 'frontend', 'public', 'logo new eth .jpg'), name: 'ethnotech_logo_full' },
    { file: path.join(__dirname, '..', '..', 'frontend', 'public', 'logo img eth.jpg'), name: 'ethnotech_logo_icon' },
  ];

  for (const logo of logos) {
    try {
      const result = await cloudinary.uploader.upload(logo.file, {
        public_id: `ethnotech/${logo.name}`,
        overwrite: true,
        resource_type: 'image',
      });
      console.log(`✅ ${logo.name}: ${result.secure_url}`);
    } catch (err) {
      console.error(`❌ ${logo.name}:`, err.message);
    }
  }
}

uploadLogos();
