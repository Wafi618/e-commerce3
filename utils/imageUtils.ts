// Helper function to extract image URL from HTML or return as-is
export const getImageUrl = (imageString: string): string => {
  if (!imageString) return '';
  if (imageString.includes('src="')) {
    const match = imageString.match(/src="([^"]+)"/);
    return match ? match[1] : imageString;
  }
  return imageString;
};
