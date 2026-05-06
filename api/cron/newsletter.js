import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const config = { maxDuration: 60 }

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  // Vercel cron 인증
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end()
  }

  // TOP 5 트랙 조회 (play_count 기준)
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, title, artist, cover_url, play_count')
    .eq('is_public', true)
    .order('play_count', { ascending: false })
    .limit(5)

  if (!tracks?.length) return res.json({ sent: 0, reason: 'no tracks' })

  // 각 트랙의 좋아요 수 조회
  const trackIds = tracks.map(t => t.id)
  const { data: likeCounts } = await supabase
    .from('likes')
    .select('track_id')
    .in('track_id', trackIds)

  const likeMap = {}
  for (const l of likeCounts || []) {
    likeMap[l.track_id] = (likeMap[l.track_id] || 0) + 1
  }

  const tracksWithLikes = tracks.map(t => ({ ...t, like_count: likeMap[t.id] || 0 }))

  // 구독자 조회
  const { data: subscribers } = await supabase
    .from('profiles')
    .select('email')
    .eq('newsletter_subscribed', true)
    .not('email', 'is', null)

  if (!subscribers?.length) return res.json({ sent: 0, reason: 'no subscribers' })

  const now = new Date()
  const weekLabel = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${Math.ceil(now.getDate() / 7)}주차`

  // Resend 배치 발송 (최대 100개씩)
  const emails = subscribers.map(s => ({
    from: 'WAVERSE <noreply@waverse.net>',
    to: s.email,
    subject: `🎵 ${weekLabel} WAVERSE TOP 5`,
    html: buildNewsletterHtml(tracksWithLikes, weekLabel),
  }))

  let sent = 0
  for (let i = 0; i < emails.length; i += 100) {
    await resend.batch.send(emails.slice(i, i + 100))
    sent += Math.min(100, emails.length - i)
  }

  console.log(`[newsletter] sent ${sent} emails`)
  res.json({ sent })
}

function buildNewsletterHtml(tracks, weekLabel) {
  const trackRows = tracks.map((t, i) => `
    <tr>
      <td style="padding:16px 0;border-bottom:1px solid rgba(29,158,117,0.1);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px;vertical-align:middle;">
              <span style="font-size:22px;font-weight:900;color:${i === 0 ? '#4ecca3' : 'rgba(255,255,255,0.3)'};">${i + 1}</span>
            </td>
            <td style="width:48px;padding:0 12px;vertical-align:middle;">
              <div style="width:48px;height:48px;border-radius:10px;overflow:hidden;background:#112219;display:inline-block;vertical-align:middle;">
                ${t.cover_url
                  ? `<img src="${t.cover_url}" width="48" height="48" style="display:block;object-fit:cover;" alt="">`
                  : `<div style="width:48px;height:48px;display:flex;align-items:center;justify-content:center;font-size:20px;">🎵</div>`
                }
              </div>
            </td>
            <td style="vertical-align:middle;">
              <p style="margin:0;font-size:14px;font-weight:700;color:white;">${escHtml(t.title)}</p>
              <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">${escHtml(t.artist || '아티스트 미상')}</p>
            </td>
            <td style="text-align:right;vertical-align:middle;white-space:nowrap;">
              <span style="font-size:11px;color:rgba(255,255,255,0.3);">▶ ${t.play_count ?? 0}</span>
              <span style="font-size:11px;color:rgba(255,255,255,0.2);margin-left:8px;">♥ ${t.like_count}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${weekLabel} WAVERSE TOP 5</title>
</head>
<body style="margin:0;padding:0;background:#0b1612;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 20px 40px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="font-size:24px;font-weight:900;color:white;margin:0 0 6px;letter-spacing:-0.5px;">
        WA<span style="color:#1D9E75;">VERSE</span>
      </h1>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">${weekLabel} 인기 차트</p>
    </div>

    <!-- Card -->
    <div style="background:#0e1f18;border:1px solid rgba(29,158,117,0.25);border-radius:20px;padding:24px 24px 8px;">
      <p style="font-size:17px;font-weight:800;color:white;margin:0 0 4px;">이번 주 TOP 5 🔥</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.4);margin:0 0 20px;">재생 수 + 좋아요 기준</p>

      <table width="100%" cellpadding="0" cellspacing="0">
        ${trackRows}
      </table>

      <div style="text-align:center;padding:24px 0 8px;">
        <a href="https://waverse.net/discover" style="display:inline-block;background:#1D9E75;color:white;font-size:14px;font-weight:700;padding:13px 32px;border-radius:12px;text-decoration:none;">
          전체 차트 보기 →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:28px;">
      <p style="color:rgba(255,255,255,0.18);font-size:11px;margin:0;">
        © 2026 WAVERSE ·
        <a href="https://waverse.net" style="color:rgba(29,158,117,0.5);text-decoration:none;">waverse.net</a>
      </p>
      <p style="color:rgba(255,255,255,0.12);font-size:11px;margin:6px 0 0;">
        뉴스레터 수신을 원하지 않으면 프로필 설정에서 구독을 해제하세요
      </p>
    </div>

  </div>
</body>
</html>`
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
