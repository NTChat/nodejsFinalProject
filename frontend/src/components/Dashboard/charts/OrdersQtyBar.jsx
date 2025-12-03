import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export default function OrdersQtyBar({ data = [] }) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="orders" name="Số đơn" />
          <Bar dataKey="qty"    name="Số lượng SP" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
