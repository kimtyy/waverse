import { Resend } from 'resend'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!process.env.RESEND_API_KEY) {
    console.error('[email/welcome] RESEND_API_KEY is not set')
    return res.status(500).json({ error: 'RESEND_API_KEY not configured' })
  }

  const { email, username } = req.body
  if (!email) return res.status(400).json({ error: 'email required' })

  const name = username || email.split('@')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const result = await resend.emails.send({
      from: 'WAVERSE <noreply@waverse.net>',
      to: email,
      subject: 'WAVERSE에 오신 것을 환영합니다! 🎵',
      html: buildWelcomeHtml(name),
    })
    console.log('[email/welcome] sent to', email, 'id:', result.data?.id)
    res.json({ ok: true, id: result.data?.id })
  } catch (err) {
    console.error('[email/welcome] resend error:', err.message)
    res.status(500).json({ error: err.message })
  }
}

function buildWelcomeHtml(name) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>WAVERSE에 오신 것을 환영합니다!</title>
</head>
<body style="margin:0;padding:0;background:#0b1612;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:48px 20px 40px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:36px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:68px;height:68px;background:linear-gradient(135deg,#1D9E75,#0a4433);border-radius:22px;margin-bottom:14px;box-shadow:0 0 32px rgba(29,158,117,0.4);">
        <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <rect x="54"  y="216" width="44" height="80"  rx="22" fill="white" opacity="0.5"/>
          <rect x="114" y="176" width="44" height="160" rx="22" fill="white" opacity="0.7"/>
          <rect x="174" y="136" width="44" height="240" rx="22" fill="white" opacity="0.9"/>
          <rect x="234" y="96"  width="44" height="320" rx="22" fill="white"/>
          <rect x="294" y="136" width="44" height="240" rx="22" fill="white" opacity="0.9"/>
          <rect x="354" y="176" width="44" height="160" rx="22" fill="white" opacity="0.7"/>
          <rect x="414" y="216" width="44" height="80"  rx="22" fill="white" opacity="0.5"/>
        </svg>
      </div>
      <h1 style="font-size:28px;font-weight:900;color:white;margin:0;letter-spacing:-0.5px;">
        WA<span style="color:#1D9E75;">VERSE</span>
      </h1>
    </div>

    <!-- Card -->
    <div style="background:#0e1f18;border:1px solid rgba(29,158,117,0.25);border-radius:20px;padding:32px;">
      <h2 style="color:white;font-size:20px;font-weight:800;margin:0 0 10px;letter-spacing:-0.3px;">
        환영합니다, ${name}님! 🎵
      </h2>
      <p style="color:rgba(255,255,255,0.55);font-size:14px;line-height:1.75;margin:0 0 28px;">
        WAVERSE에 가입해 주셔서 감사합니다.<br>
        누가 만들었든, 좋은 음악이면 됩니다.
      </p>

      <!-- Highlight box -->
      <div style="background:rgba(29,158,117,0.08);border:1px solid rgba(29,158,117,0.2);border-radius:14px;padding:20px;margin-bottom:28px;">
        <p style="color:rgba(255,255,255,0.75);font-size:13px;font-weight:700;margin:0 0 12px;">지금 바로 시작해보세요</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🎵</td>
            <td style="padding:4px 0 4px 8px;color:rgba(255,255,255,0.5);font-size:13px;">음악 업로드하기</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🔍</td>
            <td style="padding:4px 0 4px 8px;color:rgba(255,255,255,0.5);font-size:13px;">인기 트랙 탐색하기</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🎛️</td>
            <td style="padding:4px 0 4px 8px;color:rgba(255,255,255,0.5);font-size:13px;">MR 분리로 반주 추출하기</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:rgba(255,255,255,0.5);font-size:13px;">🔗</td>
            <td style="padding:4px 0 4px 8px;color:rgba(255,255,255,0.5);font-size:13px;">SNS에 트랙 공유하기</td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="https://waverse.net" style="display:inline-block;background:#1D9E75;color:white;font-size:15px;font-weight:700;padding:14px 36px;border-radius:12px;text-decoration:none;letter-spacing:-0.2px;box-shadow:0 0 24px rgba(29,158,117,0.4);">
          WAVERSE 시작하기 →
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
        이 이메일은 WAVERSE 회원가입 시 자동으로 발송됩니다
      </p>
    </div>

  </div>
</body>
</html>`
}
