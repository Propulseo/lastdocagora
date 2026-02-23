import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, MessageSquare, BellOff } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

const channelLabel: Record<string, string> = {
  email: "Email",
  sms: "SMS",
  push: "Push",
};

const triggerLabel: Record<string, string> = {
  before: "Antes",
  after: "Depois",
};

const typeLabel: Record<string, string> = {
  reminder: "Lembrete",
  confirmation: "Confirmacao",
  follow_up: "Acompanhamento",
};

const delayUnitLabel: Record<string, string> = {
  hours: "hora(s)",
  days: "dia(s)",
  minutes: "minuto(s)",
};

export default async function RemindersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: professional } = await supabase
    .from("professionals")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!professional) redirect("/login");

  const [{ data: rules }, { data: templates }] = await Promise.all([
    supabase
      .from("reminder_rules")
      .select("*, message_templates(name, content, channel)")
      .eq("professional_id", professional.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("message_templates")
      .select("*")
      .eq("professional_id", professional.id)
      .order("created_at", { ascending: false }),
  ]);

  const reminderRules = rules ?? [];
  const messageTemplates = templates ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lembretes"
        description="Regras de lembrete e modelos de mensagem"
      />

      {/* Reminder Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Regras de Lembrete
          </CardTitle>
          <CardDescription>
            {reminderRules.length} regra
            {reminderRules.length !== 1 ? "s" : ""} configurada
            {reminderRules.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminderRules.length === 0 ? (
            <EmptyState
              icon={BellOff}
              title="Sem regras"
              description="Nenhuma regra de lembrete configurada."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Momento
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Atraso
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Template
                    </TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminderRules.map((rule) => {
                    const template = rule.message_templates as {
                      name: string;
                      content: string;
                      channel: string;
                    } | null;
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">
                          {typeLabel[rule.type] ?? rule.type}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {rule.channel === "email" ? (
                              <Mail className="size-3" />
                            ) : (
                              <MessageSquare className="size-3" />
                            )}
                            {channelLabel[rule.channel] ?? rule.channel}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {triggerLabel[rule.trigger_moment] ??
                            rule.trigger_moment}
                        </TableCell>
                        <TableCell className="hidden tabular-nums md:table-cell">
                          {rule.delay_value}{" "}
                          {delayUnitLabel[rule.delay_unit] ?? rule.delay_unit}
                        </TableCell>
                        <TableCell className="hidden max-w-[200px] truncate text-muted-foreground lg:table-cell">
                          {template?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={rule.is_enabled ? "default" : "secondary"}
                          >
                            {rule.is_enabled ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Mensagem</CardTitle>
          <CardDescription>
            {messageTemplates.length} modelo
            {messageTemplates.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messageTemplates.length === 0 ? (
            <EmptyState
              icon={Mail}
              title="Sem modelos"
              description="Nenhum modelo de mensagem criado."
            />
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Conteudo
                    </TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageTemplates.map((tpl) => (
                    <TableRow key={tpl.id}>
                      <TableCell className="font-medium">{tpl.name}</TableCell>
                      <TableCell>
                        {typeLabel[tpl.type] ?? tpl.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {channelLabel[tpl.channel] ?? tpl.channel}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden max-w-[300px] truncate text-muted-foreground md:table-cell">
                        {tpl.content}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={tpl.is_active ? "default" : "secondary"}
                        >
                          {tpl.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
