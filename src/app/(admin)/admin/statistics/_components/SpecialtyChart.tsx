"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { SpecialtyCount } from "../_lib/types";

const GRADIENT_COLORS = [
  "#3b82f6", "#60a5fa", "#818cf8", "#a78bfa",
  "#c084fc", "#d8b4fe", "#e9d5ff", "#f3e8ff",
];

export function SpecialtyChart({ data }: { data: SpecialtyCount[] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.topSpecialtiesTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <div style={{ height: Math.max(200, data.length * 36) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data} layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category" dataKey="specialty"
                  width={130} tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_, i) => (
                    <Cell key={i} fill={GRADIENT_COLORS[i % GRADIENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
