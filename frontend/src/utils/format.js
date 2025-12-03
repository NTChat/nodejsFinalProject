// src/utils/format.js
export const currency = (n) => {
  const v = Number(n);
  return (Number.isFinite(v) ? v : 0).toLocaleString("vi-VN") + " ₫";
};
