"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminI18n } from "@/lib/i18n/admin/useAdminI18n";
import type { TopPro } from "../_lib/types";

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function TopProfessionals({ data }: { data: TopPro[] }) {
  const { t } = useAdminI18n();
  const s = t.statistics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{s.topProsTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{s.noData}</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 pr-2 font-medium">{s.rank}</th>
                <th className="pb-2 pr-2 font-medium">{s.name}</th>
                <th className="pb-2 pr-2 font-medium">{s.specialty}</th>
                <th className="pb-2 pr-2 text-right font-medium">{s.appointments}</th>
                <th className="pb-2 pr-2 text-right font-medium">{s.rating}</th>
                <th className="pb-2 font-medium">{s.city}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((pro, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2.5 pr-2 font-medium text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7">
                        {pro.avatar_url && <AvatarImage src={pro.avatar_url} alt={pro.name} />}
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(pro.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{pro.name}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-2 text-muted-foreground">
                    {pro.specialty}
                  </td>
                  <td className="py-2.5 pr-2 text-right font-medium tabular-nums">
                    {pro.appointmentCount}
                  </td>
                  <td className="py-2.5 pr-2 text-right">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span className="tabular-nums">{pro.rating.toFixed(1)}</span>
                    </span>
                  </td>
                  <td className="py-2.5">
                    <Badge variant="outline" className="text-xs font-normal">
                      {pro.city}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
