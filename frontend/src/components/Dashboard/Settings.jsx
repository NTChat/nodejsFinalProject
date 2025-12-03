// frontend/src/components/Dashboard/Settings.jsx
import { API_BASE } from "../../services/api";

export default function Settings() {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-xl font-semibold">Settings</h2>
      <div className="rounded-2xl border p-4 bg-white">
        <div className="font-medium mb-2">Thông tin môi trường</div>
        <div className="text-sm text-gray-600">
          API Base: <b>{API_BASE}</b>
        </div>
      </div>
    </div>
  );
}
