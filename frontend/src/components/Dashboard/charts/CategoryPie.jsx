import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#84cc16","#fb7185"];

export default function CategoryPie({ data = [] }) {
  const total = data.reduce((s, r) => s + (r.value || r.qty || 0), 0);
  const ds = data.map(r => ({ name: r.name, value: r.value ?? r.qty ?? 0 }));
  return (
    <div className="w-full h-80">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip formatter={(v,n)=> [`${v} (${Math.round((v/Math.max(total,1))*100)}%)`, n]} />
          <Legend />
          <Pie data={ds} dataKey="value" nameKey="name" outerRadius={110}>
            {ds.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
