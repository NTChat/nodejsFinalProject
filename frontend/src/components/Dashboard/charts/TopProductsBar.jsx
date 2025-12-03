import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function TopProductsBar({ data = [] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(v,k)=> (k==="revenue" ? `${Number(v).toLocaleString("vi-VN")} ₫` : v)} />
          <Legend />
          <Bar  dataKey="qty"     name="Số lượng" />
          <Line dataKey="revenue" name="Doanh thu" strokeWidth={2} dot />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
