export const resizeImage = (
  file: File,
  options: { width?: number; height?: number; percentage?: number }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (options.percentage) {
        targetWidth = Math.round(img.width * (options.percentage / 100));
        targetHeight = Math.round(img.height * (options.percentage / 100));
      } else if (options.width && options.height) {
        targetWidth = options.width;
        targetHeight = options.height;
      } else if (options.width) {
        const ratio = options.width / img.width;
        targetWidth = options.width;
        targetHeight = Math.round(img.height * ratio);
      } else if (options.height) {
        const ratio = options.height / img.height;
        targetHeight = options.height;
        targetWidth = Math.round(img.width * ratio);
      }

      // Safeguard against 0 dimension
      targetWidth = Math.max(1, targetWidth);
      targetHeight = Math.max(1, targetHeight);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      // Smooth scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Determine output format based on input type
      let mimeType = file.type;
      // Default to jpeg if type is missing or unsupported natively in some browsers
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
        mimeType = 'image/jpeg';
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate image blob'));
          }
        },
        mimeType,
        mimeType === 'image/jpeg' || mimeType === 'image/webp' ? 0.92 : undefined
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = url;
  });
};

export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
};
