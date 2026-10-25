const ROOM_TYPES: Record<string, { label: string; price: string }> = {
  main_house_double: { label: 'Main House Double', price: '£150 per night' },
  garden_double:     { label: 'Garden Double',      price: '£150 per night' },
  garden_single:     { label: 'Garden Single',      price: '£75 per night'  },
  treehouse:         { label: 'The Treehouse',       price: 'Bridal Suite'   },
}

// Real inbox guests can write to. partytime@ is send-only (Resend receiving is
// off), so replies work but a fresh email to that address would bounce.
export const CONTACT_EMAIL = 'eharbinson966@gmail.com'

const COLORS = {
  bg: '#FAF4C6',
  surface: '#FFFFFF',
  primary: '#1760B0',
  chrome: '#edf6fa',
  accent: '#E07B5A',
  text: '#0D1F3C',
  muted: '#9A8898',
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export interface RsvpEmailGuest {
  first_name: string
  last_name: string
  attending_saturday: boolean | null
  attending_friday: boolean | null
  attending_sunday: boolean | null
  dietary: string | null
}

export interface RsvpEmailOpts {
  displayName: string
  isUpdate: boolean
  guests: RsvpEmailGuest[]
  roomCounts: Record<string, number>
  roomAccepted: Record<string, (boolean | null)[]>
  siteUrl: string
}

function statusRow(label: string, value: boolean | null): string {
  const text = value === null ? 'NOT ANSWERED' : value ? '✓ YES' : '✗ NO'
  const color = value === null ? COLORS.muted : value ? COLORS.accent : COLORS.muted
  return `<tr>
    <td style="padding:3px 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${COLORS.muted};">${esc(label)}</td>
    <td style="padding:3px 0;text-align:right;white-space:nowrap;font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:1px;color:${color};">${text}</td>
  </tr>`
}

function guestBlock(g: RsvpEmailGuest, showName: boolean): string {
  const name = showName
    ? `<div style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:2px;color:${COLORS.primary};margin:18px 0 4px;">${esc(g.first_name.toUpperCase())} ${esc(g.last_name.toUpperCase())}</div>`
    : ''
  const dietary = g.dietary
    ? `<div style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:1px;color:${COLORS.muted};margin-top:3px;">DIETARY: ${esc(g.dietary)}</div>`
    : ''
  return `${name}<table role="presentation" width="100%" style="border-collapse:collapse;">
    ${statusRow("Friday 11th June — St Andrew's Church", g.attending_friday)}
    ${statusRow('Saturday 12th June — Deer Park', g.attending_saturday)}
    ${statusRow('Sunday 13th June — BBQ brunch', g.attending_sunday)}
  </table>${dietary}`
}

function roomsBlock(roomCounts: Record<string, number>, roomAccepted: Record<string, (boolean | null)[]>): string {
  const rows = Object.entries(roomCounts)
    .filter(([, n]) => n > 0)
    .flatMap(([type, count]) => {
      const info = ROOM_TYPES[type]
      if (!info) return []
      return Array.from({ length: count }, (_, i) => {
        const label = `${info.label}${count > 1 ? ` #${i + 1}` : ''} — ${info.price}`
        return statusRow(label, roomAccepted[type]?.[i] ?? null)
      })
    })
  if (rows.length === 0) return ''
  return `<div style="font-family:'Courier New',Courier,monospace;font-size:12px;letter-spacing:2px;color:${COLORS.primary};margin:20px 0 4px;">ROOMS</div>
  <table role="presentation" width="100%" style="border-collapse:collapse;">${rows.join('')}</table>`
}

export function buildRsvpEmail(opts: RsvpEmailOpts): { subject: string; html: string; text: string } {
  const { displayName, isUpdate, guests, roomCounts, roomAccepted, siteUrl } = opts
  const showNames = guests.length > 1

  const badge = isUpdate ? '✉ RSVP UPDATED' : '🍸 RSVP RECEIVED'
  const heading = isUpdate ? 'Your RSVP has been updated' : "Thanks for your RSVP!"
  const intro = isUpdate
    ? `Hi ${esc(displayName)}, we've updated your RSVP. Here's what we've got on file now.`
    : `Hi ${esc(displayName)}, thanks for letting us know. Here's what we've got on file.`

  const guestsHtml = guests.map(g => guestBlock(g, showNames)).join('')
  const roomsHtml = roomsBlock(roomCounts, roomAccepted)

  const subject = isUpdate
    ? `Your RSVP has been updated, ${displayName}`
    : `Thanks for your RSVP, ${displayName}!`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:28px 16px;background-color:${COLORS.bg};">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;border-collapse:collapse;">
    <tr><td style="background-color:${COLORS.accent};height:6px;border-radius:10px 10px 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
    <tr>
      <td style="background-color:${COLORS.chrome};padding:10px 18px;">
        <span style="font-family:'Courier New',Courier,monospace;font-size:13px;letter-spacing:3px;color:${COLORS.text};">${badge}</span>
      </td>
    </tr>
    <tr>
      <td style="background-color:${COLORS.surface};border-left:1px solid rgba(13,31,60,0.12);border-right:1px solid rgba(13,31,60,0.12);padding:30px 26px;">
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;font-size:27px;color:${COLORS.primary};margin:0 0 16px;line-height:1.25;">${esc(heading)}</h1>
        <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:${COLORS.muted};line-height:1.5;margin:0 0 8px;">${intro}</p>

        ${guestsHtml}
        ${roomsHtml}

        <div style="text-align:center;margin:30px 0 10px;">
          <a href="${esc(siteUrl)}" style="display:inline-block;background-color:${COLORS.primary};color:${COLORS.bg};font-family:'Courier New',Courier,monospace;font-size:15px;letter-spacing:2px;text-decoration:none;padding:12px 28px;border-radius:2px;">VIEW OR UPDATE RSVP</a>
        </div>

        <p style="font-family:Georgia,'Times New Roman',serif;font-style:italic;color:${COLORS.accent};font-size:15px;margin:26px 0 0;">Bechan &amp; Ethan</p>

        <p style="font-family:'Courier New',Courier,monospace;font-size:10px;letter-spacing:0.5px;color:${COLORS.muted};margin-top:24px;line-height:1.5;">
          This is an automated confirmation. Hit reply if you need to ask us anything, or email us directly at
          <a href="mailto:${CONTACT_EMAIL}" style="color:${COLORS.primary};">${CONTACT_EMAIL}</a>.
        </p>
      </td>
    </tr>
    <tr><td style="background-color:${COLORS.accent};height:6px;border-radius:0 0 10px 10px;font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>
</body>
</html>`

  const text = [
    heading,
    '',
    intro.replace(/<[^>]+>/g, ''),
    '',
    ...guests.flatMap(g => [
      showNames ? `${g.first_name.toUpperCase()} ${g.last_name.toUpperCase()}` : null,
      `  Friday 11th June — St Andrew's Church: ${g.attending_friday === null ? 'not answered' : g.attending_friday ? 'yes' : 'no'}`,
      `  Saturday 12th June — Deer Park: ${g.attending_saturday === null ? 'not answered' : g.attending_saturday ? 'yes' : 'no'}`,
      `  Sunday 13th June — BBQ brunch: ${g.attending_sunday === null ? 'not answered' : g.attending_sunday ? 'yes' : 'no'}`,
      g.dietary ? `  Dietary: ${g.dietary}` : null,
      '',
    ].filter((l): l is string => l !== null)),
    `View or update your RSVP any time: ${siteUrl}`,
    '',
    'Bechan & Ethan',
    '',
    `Questions? Reply to this email or write to us at ${CONTACT_EMAIL}`,
  ].join('\n')

  return { subject, html, text }
}
