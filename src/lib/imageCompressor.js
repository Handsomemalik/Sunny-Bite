/**
 * Client-Side Image Compressor & WebP Converter
 * Resizes large photos to a maximum width (default 1600px), converts to modern WebP format (~80% quality),
 * and generates clean sanitized file names.
 */

export async function compressImageToWebP(file, maxWidth = 1600, quality = 0.82) {
  if (!file) throw new Error('No file provided for compression.');

  // Validate MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Please upload a JPEG, PNG, WebP, or SVG.`);
  }

  // SVGs are vector graphics; return directly without raster canvas conversion
  if (file.type === 'image/svg+xml') {
    return {
      blob: file,
      file,
      width: null,
      height: null,
      size: file.size,
      name: file.name
    };
  }

  // Load image into an HTMLImageElement
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image data. The file may be corrupted.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while preserving aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context is unavailable.'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Image WebP compression failed.'));
              return;
            }

            // Generate clean WebP filename
            const cleanBaseName = file.name
              .replace(/\.[^/.]+$/, '')
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, '-');
            const fileName = `${cleanBaseName}-${Date.now()}.webp`;

            const compressedFile = new File([blob], fileName, { type: 'image/webp' });

            resolve({
              blob,
              file: compressedFile,
              width,
              height,
              size: blob.size,
              name: fileName
            });
          },
          'image/webp',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
