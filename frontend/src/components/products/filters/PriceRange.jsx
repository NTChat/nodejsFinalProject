import { useEffect, useMemo, useState } from "react";

// helpers
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function snapToStep(n, step) {
  if (!step) return n;
  return Math.round(n / step) * step;
}
const nfVN = new Intl.NumberFormat("vi-VN");
const fmtVN = (n) => nfVN.format(Math.max(0, Number(n) || 0));
const unfmtVN = (s) => Number(String(s).replace(/[^\d]/g, "")) || 0;

export default function PriceRange({
  min = 0,
  max = 99_999_999,   // mặc định 99.999.999 VND
  step = 1_000_000,
  valueMin,
  valueMax,
  onChange,
}) {
  // state số (điều khiển slider)
  const [minVal, setMinVal] = useState(valueMin ?? min);
  const [maxVal, setMaxVal] = useState(valueMax ?? max);

  // state text hiển thị trong input (định dạng 1.000.000)
  const [minInput, setMinInput] = useState(fmtVN(valueMin ?? min));
  const [maxInput, setMaxInput] = useState(fmtVN(valueMax ?? max));

  // đồng bộ khi props đổi
  useEffect(() => {
    const v = valueMin ?? min;
    setMinVal(v);
    setMinInput(fmtVN(v));
  }, [valueMin, min]);

  useEffect(() => {
    const v = valueMax ?? max;
    setMaxVal(v);
    setMaxInput(fmtVN(v));
  }, [valueMax, max]);

  // phần trăm fill track
  const leftPct = useMemo(
    () => ((minVal - min) / (max - min)) * 100,
    [minVal, min, max]
  );
  const rightPct = useMemo(
    () => 100 - ((maxVal - min) / (max - min)) * 100,
    [maxVal, min, max]
  );

  const emit = (mi, ma) => onChange?.({ min: mi, max: ma });

  // cập nhật từ slider (range)
  const changeMin = (num) => {
    let n = clamp(Number(num || 0), min, maxVal - step);
    n = snapToStep(n, step);
    setMinVal(n);
    setMinInput(fmtVN(n));
    emit(n, maxVal);
  };
  const changeMax = (num) => {
    let n = clamp(Number(num || 0), minVal + step, max);
    n = snapToStep(n, step);
    setMaxVal(n);
    setMaxInput(fmtVN(n));
    emit(minVal, n);
  };

  // cập nhật từ ô text đã định dạng
  const handleMinText = (s) => {
    const raw = unfmtVN(s);
    changeMin(raw);
  };
  const handleMaxText = (s) => {
    const raw = unfmtVN(s);
    changeMax(raw);
  };

  return (
    <div>
      {/* Inputs định dạng vi-VN với styling cải thiện */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={minInput}
              onChange={(e) => handleMinText(e.target.value)}
              onBlur={(e) => setMinInput(fmtVN(unfmtVN(e.target.value)))}
              className="w-full rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-3 py-2 pr-6 text-sm font-medium transition-all outline-none"
              placeholder="Tối thiểu"
              aria-label="Giá tối thiểu"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">đ</span>
          </div>
        </div>
        <span className="text-gray-400 font-bold">–</span>
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={maxInput}
              onChange={(e) => handleMaxText(e.target.value)}
              onBlur={(e) => setMaxInput(fmtVN(unfmtVN(e.target.value)))}
              className="w-full rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 px-3 py-2 pr-6 text-sm font-medium transition-all outline-none"
              placeholder="Tối đa"
              aria-label="Giá tối đa"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">đ</span>
          </div>
        </div>
      </div>

      {/* Slider đôi với styling cải thiện */}
      <div className="mt-5 range-double">
        <div className="range-track" />
        <div
          className="range-fill bg-gradient-to-r from-blue-500 to-blue-600"
          style={{ left: `${leftPct}%`, right: `${rightPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={(e) => changeMin(e.target.value)}
          className="price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={(e) => changeMax(e.target.value)}
          className="price"
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mt-2 px-1">
        <span className="bg-gray-100 px-2 py-0.5 rounded">{fmtVN(min)} đ</span>
        <span className="bg-gray-100 px-2 py-0.5 rounded">{fmtVN(max)} đ</span>
      </div>
    </div>
  );
}
