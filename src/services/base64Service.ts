export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const getMimeTypeFromBase64 = (base64String: string): string | null => {
  const match = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  return match ? match[1] : null;
};

export const createImgTagWithBase64 = (base64String: string): string => {
  return `<img src="${base64String}" alt="Base64 encoded image" />`;
};
