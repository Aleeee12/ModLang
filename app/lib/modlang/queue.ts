export function makeFileKey(file: File) {
  return `${file.name}__${file.size}__${file.lastModified}`;
}