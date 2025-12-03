import React from 'react';

export default function StarRating({ value = 0, size = 18, onChange, readOnly=false }) {
  const stars = [1,2,3,4,5];
  return (
    <div className="flex items-center gap-1">
      {stars.map(s => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(s)}
          className="p-0"
          aria-label={`rate-${s}`}
          title={`${s} sao`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={s <= value ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
            <path d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.402 8.168L12 19.771l-7.336 3.895 1.402-8.168L.132 9.211l8.2-1.193L12 .587z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}
