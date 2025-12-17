import heic2any from 'heic2any';

export const convertHeicToJpeg = async (
  file: File,
  quality: number
): Promise<Blob> => {
  // heic2any returns a Blob or an array of Blobs. Since we input one file, we expect one blob (or the first frame).
  const result = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: quality / 100, // library expects 0-1
  });

  if (Array.isArray(result)) {
    return result[0];
  }
  return result;
};
