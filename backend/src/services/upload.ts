import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImage(
  buffer: Buffer,
  folder: 'avatars' | 'products' | 'reviews' | 'brands',
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `voyabox/${folder}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'));
          resolve(result.secure_url);
        },
      )
      .end(buffer);
  });
}

export async function deleteImage(url: string): Promise<void> {
  const parts = url.split('/');
  const file = parts[parts.length - 1].split('.')[0];
  const folder = parts[parts.length - 2];
  const publicId = `voyabox/${folder}/${file}`;
  await cloudinary.uploader.destroy(publicId);
}
