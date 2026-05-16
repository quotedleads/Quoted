const nodemailer = require('nodemailer');

const rateLimitMap = {};

function rateLimit(ip, max = 10, windowMs = 60 * 60 * 1000) {
  const now = Date.now();
  if (!rateLimitMap[ip]) rateLimitMap[ip] = [];
  rateLimitMap[ip] = rateLimitMap[ip].filter(t => now - t < windowMs);
  if (rateLimitMap[ip].length >= max) return false;
  rateLimitMap[ip].push(now);
  return true;
}

function sanitize(str, max = 500) {
  return String(str || '').trim().slice(0, max).replace(/[<>]/g, '');
}

const templates = {
  'form-code': ({ clientName, formCode, eventType, eventDate, location }) => ({
    subject: `Your Quoted Form Code: ${formCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8dcc8;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1209;padding:28px 32px;text-align:center;">
          <h1 style="color:#C9A84C;font-size:28px;margin:0;">Quoted<span style="color:#fff;">.</span></h1>
          <p style="color:rgba(255,255,255,0.6);font-size:13px;margin:6px 0 0;">Photography Leads Marketplace</p>
        </div>
        <div style="padding:32px;background:#FFFDF9;">
          <h2 style="color:#1A1209;margin:0 0 12px;">Hi ${sanitize(clientName)}!</h2>
          <p style="color:#7A6652;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your photography request has been submitted! Save your form code below — you'll need it to leave a review after your event.
          </p>
          <div style="background:#FDF6E3;border:2px solid #C9A84C;border-radius:10px;padding:24px;margin-bottom:24px;text-align:center;">
            <p style="font-size:12px;color:#7A6652;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Form Code</p>
            <p style="font-size:36px;font-weight:700;color:#C9A84C;letter-spacing:6px;margin:0;font-family:monospace;">${sanitize(formCode)}</p>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
            <tr><td style="padding:6px 0;color:#7A6652;width:40%;">Event Type</td><td style="color:#1A1209;font-weight:500;">${sanitize(eventType)}</td></tr>
            <tr><td style="padding:6px 0;color:#7A6652;">Event Date</td><td style="color:#1A1209;font-weight:500;">${sanitize(eventDate)}</td></tr>
            <tr><td style="padding:6px 0;color:#7A6652;">Location</td><td style="color:#1A1209;font-weight:500;">${sanitize(location)}</td></tr>
          </table>
          <p style="color:#7A6652;font-size:13px;">Questions? Email us at <a href="mailto:${process.env.GMAIL_USER}" style="color:#C9A84C;">${process.env.GMAIL_USER}</a></p>
        </div>
        <div style="background:#F5F0E8;padding:16px 32px;text-align:center;font-size:12px;color:#7A6652;">
          © ${new Date().getFullYear()} Quoted
        </div>
      </div>`,
  }),

  'review-request': ({ clientName, photographerName, studioName, formCode, reviewUrl }) => ({
    subject: `${sanitize(photographerName)} would love your review on Quoted`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8dcc8;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1209;padding:28px 32px;text-align:center;">
          <h1 style="color:#C9A84C;font-size:28px;margin:0;">Quoted<span style="color:#fff;">.</span></h1>
        </div>
        <div style="padding:32px;background:#FFFDF9;">
          <h2 style="color:#1A1209;margin:0 0 12px;">Hi ${sanitize(clientName)}!</h2>
          <p style="color:#7A6652;font-size:15px;line-height:1.6;margin:0 0 24px;">
            <strong>${sanitize(photographerName)}</strong>${studioName ? ` from <strong>${sanitize(studioName)}</strong>` : ''} is requesting a review. It only takes 2 minutes!
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${sanitize(reviewUrl)}" style="display:inline-block;background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Leave a Review ★</a>
          </div>
          <div style="background:#FDF6E3;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="font-size:13px;color:#7A6652;margin:0 0 6px;font-weight:600;">Your form code:</p>
            <p style="font-size:24px;font-weight:700;color:#C9A84C;letter-spacing:4px;margin:0;font-family:monospace;">${sanitize(formCode)}</p>
          </div>
        </div>
        <div style="background:#F5F0E8;padding:16px 32px;text-align:center;font-size:12px;color:#7A6652;">
          © ${new Date().getFullYear()} Quoted
        </div>
      </div>`,
  }),

  'password-reset': ({ name, resetUrl }) => ({
    subject: 'Reset your Quoted password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8dcc8;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1209;padding:28px 32px;text-align:center;">
          <h1 style="color:#C9A84C;font-size:28px;margin:0;">Quoted<span style="color:#fff;">.</span></h1>
        </div>
        <div style="padding:32px;background:#FFFDF9;">
          <h2 style="color:#1A1209;margin:0 0 12px;">Reset Your Password</h2>
          <p style="color:#7A6652;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hi ${sanitize(name)}, click the button below to reset your password. This link expires in <strong>1 hour</strong>.
          </p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${sanitize(resetUrl)}" style="display:inline-block;background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">Reset My Password →</a>
          </div>
          <div style="background:#FAF7F2;border-radius:8px;padding:14px;margin-bottom:16px;">
            <p style="font-size:12px;color:#7A6652;margin:0 0 4px;">Or paste this link in your browser:</p>
            <p style="font-size:12px;color:#C9A84C;word-break:break-all;margin:0;">${sanitize(resetUrl)}</p>
          </div>
          <p style="color:#7A6652;font-size:13px;">If you didn't request this, ignore this email — your password won't change.</p>
        </div>
        <div style="background:#F5F0E8;padding:16px 32px;text-align:center;font-size:12px;color:#7A6652;">
          © ${new Date().getFullYear()} Quoted · Link expires in 1 hour
        </div>
      </div>`,
  }),

  'new-lead': ({ photographerName, eventType, location, eventDate, leadCost }) => ({
    subject: `New ${sanitize(eventType)} lead available — ${sanitize(location)}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e8dcc8;border-radius:12px;overflow:hidden;">
        <div style="background:#1A1209;padding:28px 32px;text-align:center;">
          <h1 style="color:#C9A84C;font-size:28px;margin:0;">Quoted<span style="color:#fff;">.</span></h1>
        </div>
        <div style="padding:32px;background:#FFFDF9;">
          <h2 style="color:#1A1209;margin:0 0 12px;">New Lead Available 📸</h2>
          <p style="color:#7A6652;font-size:15px;margin:0 0 20px;">Hi ${sanitize(photographerName)}, a new lead just came in!</p>
          <div style="background:#FDF6E3;border:1.5px solid #C9A84C;border-radius:10px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:5px 0;color:#7A6652;width:40%;">Event Type</td><td style="color:#1A1209;font-weight:600;">${sanitize(eventType)}</td></tr>
              <tr><td style="padding:5px 0;color:#7A6652;">Location</td><td style="color:#1A1209;font-weight:600;">${sanitize(location)}</td></tr>
              <tr><td style="padding:5px 0;color:#7A6652;">Event Date</td><td style="color:#1A1209;font-weight:600;">${sanitize(eventDate)}</td></tr>
              <tr><td style="padding:5px 0;color:#7A6652;">Lead Cost</td><td style="color:#C9A84C;font-weight:700;font-size:16px;">${sanitize(String(leadCost))} pts</td></tr>
            </table>
          </div>
          <div style="text-align:center;">
            <a href="${process.env.SITE_URL || 'https://quoted-alpha.vercel.app'}" style="display:inline-block;background:#C9A84C;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;">View Lead →</a>
          </div>
        </div>
        <div style="background:#F5F0E8;padding:16px 32px;text-align:center;font-size:12px;color:#7A6652;">
          © ${new Date().getFullYear()} Quoted
        </div>
      </div>`,
  }),
};

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!rateLimit(ip, 20, 60 * 60 * 1000)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { type, to, data } = req.body || {};

  if (!type || !to || !data) {
    return res.status(400).json({ error: 'Missing required fields: type, to, data' });
  }
  if (!templates[type]) {
    return res.status(400).json({ error: `Unknown email type: ${type}` });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // Check env vars
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[Quoted] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''), // remove spaces just in case
      },
    });

    const { subject, html } = templates[type](data);

    await transporter.sendMail({
      from: `"Quoted" <${process.env.GMAIL_USER}>`,
      to: sanitize(to, 200),
      subject,
      html,
      text: html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    });

    console.log(`[Quoted] Email sent: type=${type} to=${to}`);
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[Quoted] Email error:', err.message, err.code);
    return res.status(500).json({ 
      error: 'Failed to send email',
      detail: err.message // include detail for debugging
    });
  }
};
