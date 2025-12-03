import Calendar from "../common/Calendar";

export default function TimeGranularityPicker({ value, onChange, from, to, onRangeChange }) {
  const opts = ["year", "quarter", "month", "week", "custom"];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {opts.map(k => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-3 py-1.5 rounded border ${value===k ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
        >
          {k.toUpperCase()}
        </button>
      ))}

      {value === "custom" && (
        <div className="flex gap-2 items-center">
          <div className="w-36">
            <Calendar
              value={from || ""}
              onChange={(val) => onRangeChange({ from: val ? val.split('T')[0] : "", to })}
              placeholder="Từ ngày..."
            />
          </div>
          <span>→</span>
          <div className="w-36">
            <Calendar
              value={to || ""}
              onChange={(val) => onRangeChange({ from, to: val ? val.split('T')[0] : "" })}
              placeholder="Đến ngày..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
