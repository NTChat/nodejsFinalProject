export default function KPIStat({ label, value, footer }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {footer ? <div className="text-xs text-gray-500 mt-2">{footer}</div> : null}
    </div>
  );
}
