export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

export function splitFilesByMaxSize(files, maxBytes = MAX_IMAGE_SIZE_BYTES) {
  const oversizedFiles = [];
  const validFiles = [];

  files.forEach((file) => {
    if (!file) return;
    if (file.size > maxBytes) {
      oversizedFiles.push(file);
    } else {
      validFiles.push(file);
    }
  });

  return { validFiles, oversizedFiles };
}

export function buildOversizedFilesMessage(oversizedFiles, maxBytes = MAX_IMAGE_SIZE_BYTES) {
  if (!oversizedFiles.length) return '';
  const maxMb = (maxBytes / (1024 * 1024)).toFixed(0);
  const names = oversizedFiles.map((f) => f.name).join(', ');
  return `Ogni immagine deve essere al massimo ${maxMb}MB. File troppo grandi: ${names}`;
}

