import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function RevenueProfitLine({ data = [] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip formatter={(v)=>Number(v).toLocaleString("vi-VN")} />
          <Legend />
          <Line type="monotone" dataKey="revenue" name="Doanh thu" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="profit"  name="Lợi nhuận" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
