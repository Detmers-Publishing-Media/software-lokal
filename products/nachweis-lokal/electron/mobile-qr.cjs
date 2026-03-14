// Placeholder QR code generator
// TODO: implement proper QR encoding or use qrcode-generator package
function generateQR(text) {
  const size = 21; // Version 1 QR
  const matrix = Array.from({ length: size }, () => Array(size).fill(false));
  // Simple pattern for testing — draw finder patterns in corners
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < 7; j++) {
      const isBorder = i === 0 || i === 6 || j === 0 || j === 6;
      const isInner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
      if (isBorder || isInner) {
        matrix[i][j] = true; // top-left
        matrix[i][size - 1 - j] = true; // top-right
        matrix[size - 1 - i][j] = true; // bottom-left
      }
    }
  }
  return { matrix, size, text };
}

module.exports = { generateQR };
