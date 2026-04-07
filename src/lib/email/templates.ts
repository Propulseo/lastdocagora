type EmailTemplate = { subject: string; html: string }

const wrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#0d9488;padding:24px 32px">
<h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600">DocAgora</h1>
</td></tr>
<tr><td style="padding:32px">
${content}
</td></tr>
<tr><td style="padding:16px 32px 24px;color:#71717a;font-size:12px;text-align:center;border-top:1px solid #e4e4e7">
DocAgora — Plataforma de Saúde
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`

export function newBookingEmail(
  patientName: string,
  serviceName: string,
  date: string,
  time: string,
): EmailTemplate {
  return {
    subject: `Novo agendamento: ${patientName}`,
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">Novo agendamento recebido</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>Paciente:</strong> ${patientName}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>Serviço:</strong> ${serviceName}</p>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>Data:</strong> ${date}</p>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>Hora:</strong> ${time}</p>
      <p style="margin:0;color:#71717a;font-size:14px">Aceda ao seu painel para confirmar ou recusar este agendamento.</p>
    `),
  }
}

export function appointmentConfirmedEmail(
  proName: string,
): EmailTemplate {
  return {
    subject: "Consulta confirmada",
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">A sua consulta foi confirmada</h2>
      <p style="margin:0 0 24px;color:#3f3f46"><strong>${proName}</strong> confirmou a sua consulta.</p>
      <p style="margin:0;color:#71717a;font-size:14px">Consulte os detalhes na sua área pessoal em DocAgora.</p>
    `),
  }
}

export function appointmentCancelledEmail(
  proName: string,
  reason?: string,
): EmailTemplate {
  return {
    subject: "Consulta cancelada",
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">A sua consulta foi cancelada</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong> cancelou a sua consulta.</p>
      ${reason ? `<p style="margin:0 0 24px;color:#3f3f46"><strong>Motivo:</strong> ${reason}</p>` : ""}
      <p style="margin:0;color:#71717a;font-size:14px">Pode agendar uma nova consulta na plataforma DocAgora.</p>
    `),
  }
}

export function appointmentRejectedEmail(
  proName: string,
  reason?: string,
): EmailTemplate {
  return {
    subject: "Pedido de consulta recusado",
    html: wrapper(`
      <h2 style="margin:0 0 16px;font-size:18px;color:#18181b">O seu pedido de consulta foi recusado</h2>
      <p style="margin:0 0 8px;color:#3f3f46"><strong>${proName}</strong> recusou o seu pedido de consulta.</p>
      ${reason ? `<p style="margin:0 0 24px;color:#3f3f46"><strong>Motivo:</strong> ${reason}</p>` : ""}
      <p style="margin:0;color:#71717a;font-size:14px">Pode procurar outro profissional na plataforma DocAgora.</p>
    `),
  }
}
