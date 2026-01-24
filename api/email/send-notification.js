/**
 * Email Notification Service (Vercel Serverless)
 * Sends email notifications based on user preferences
 * 
 * Setup required:
 * 1. Add SENDGRID_API_KEY to Vercel environment variables
 * 2. Or use any other email service (Resend, Mailgun, etc.)
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, subject, html, type } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email service is configured
    if (!process.env.SENDGRID_API_KEY && !process.env.RESEND_API_KEY) {
      console.warn('No email service configured');
      return res.status(200).json({ 
        success: false, 
        message: 'Email service not configured - notification not sent' 
      });
    }

    // Example: SendGrid integration
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: to,
        from: process.env.FROM_EMAIL || 'noreply@a5gallery.com',
        subject: subject,
        html: html,
      };

      await sgMail.send(msg);
      
      return res.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    }

    // Example: Resend integration
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@a5gallery.com',
          to: to,
          subject: subject,
          html: html
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email via Resend');
      }

      return res.json({ 
        success: true, 
        message: 'Email sent successfully' 
      });
    }

    return res.status(500).json({ 
      error: 'No email service configured' 
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      message: error.message
    });
  }
}
