import type { NextApiRequest, NextApiResponse } from 'next'

const RESEND_KEY = process.env.RESEND_API_KEY

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_KEY) return { ok: false, reason: 'No Resend key' }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'AllScent Hub <noreply@allscentbeauty.com>', to: [to], subject, html })
  })
  return response.json()
}

function buildEmailHtml({ assignedTo, title, priority, startDate, dueDate, assignedBy, teamTask, isReminder }: any) {
  const prioEmoji = priority === 'alta' ? '🔴' : priority === 'media' ? '🟡' : '🟢'
  const headerText = isReminder
    ? `⏰ Reminder: il task <strong>${title}</strong> scade tra 3 giorni`
    : `Ciao <strong>${assignedTo}</strong>, ti è stato assegnato un nuovo task da <strong>${assignedBy || 'il team'}</strong>:`

  return `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; background: #09090f; color: white; padding: 32px; border-radius: 12px;">
      <div style="font-size: 24px; color: #c9a96e; margin-bottom: 4px;">AllScent</div>
      <div style="font-size: 11px; color: #6b6b80; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">Marketing Hub</div>
      <div style="font-size: 15px; margin-bottom: 16px;">${headerText}</div>
      ${teamTask ? `<div style="font-size: 13px; color: #9898a8; margin-bottom: 12px;">Parte del task team: <strong style="color:white">${teamTask}</strong></div>` : ''}
      <div style="background: #1a1a24; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${title}</div>
        <div style="font-size: 13px; color: #9898a8;">${prioEmoji} Priorità <strong style="color:white">${priority}</strong></div>
        ${startDate ? `<div style="font-size: 13px; color: #9898a8; margin-top: 4px;">▶ Inizio: <strong style="color:white">${startDate}</strong></div>` : ''}
        ${dueDate ? `<div style="font-size: 13px; color: #f87171; margin-top: 4px;">⏱ Scadenza: <strong style="color:#f87171">${dueDate}</strong></div>` : ''}
      </div>
      <a href="https://allscent-hub.vercel.app/todo" style="display:inline-block; background:#c9a96e; color:black; font-weight:700; padding:12px 24px; border-radius:8px; text-decoration:none; font-size:14px;">Apri To-do →</a>
      <div style="font-size: 11px; color: #6b6b80; margin-top: 24px;">CARLOTTA SRL · AllScent Beauty</div>
    </div>
  `
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { to, assignedTo, title, priority, startDate, dueDate, assignedBy, teamTask } = req.body

  if (!RESEND_KEY) return res.status(200).json({ ok: false, reason: 'No Resend key configured' })

  try {
    // Email 1 — notifica assegnazione immediata
    await sendEmail(
      to,
      `📋 Nuovo task assegnato: ${title}`,
      buildEmailHtml({ assignedTo, title, priority, startDate, dueDate, assignedBy, teamTask, isReminder: false })
    )

    // Email 2 — reminder 3 giorni prima della scadenza (se c'è una scadenza)
    if (dueDate) {
      const due = new Date(dueDate)
      const reminderDate = new Date(due)
      reminderDate.setDate(reminderDate.getDate() - 3)
      const now = new Date()
      const msUntilReminder = reminderDate.getTime() - now.getTime()

      // Schedula il reminder via Resend scheduled send (se disponibile)
      // oppure usa un approccio semplice: invia subito se mancano meno di 3 giorni,
      // altrimenti salva in DB per il cron job
      if (msUntilReminder <= 0) {
        // Scadenza già passata o meno di 3 giorni — invia subito il reminder
        await sendEmail(
          to,
          `⏰ Reminder scadenza: ${title}`,
          buildEmailHtml({ assignedTo, title, priority, startDate, dueDate, assignedBy, teamTask, isReminder: true })
        )
      }
      // Se mancano più di 3 giorni, il reminder verrà inviato dal cron job Supabase
    }

    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(200).json({ ok: false, error: String(e) })
  }
}
