import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

function getTransporter() {
  if (!env.smtpEnabled) return null;
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Sends a notification for a new contact message. Returns false when SMTP is not configured. */
export async function notifyNewMessage(msg) {
  const t = getTransporter();
  if (!t) return false;
  await t.sendMail({
    from: env.CONTACT_NOTIFY_FROM || env.SMTP_USER,
    to: env.CONTACT_NOTIFY_TO,
    replyTo: msg.email,
    subject: `Portfolio contact: ${msg.subject || `message from ${msg.name}`}`.slice(0, 200),
    text: `From: ${msg.name} <${msg.email}>\nSubject: ${msg.subject}\n\n${msg.message}`,
    html: `<p><strong>From:</strong> ${escape(msg.name)} &lt;${escape(msg.email)}&gt;</p><p><strong>Subject:</strong> ${escape(msg.subject)}</p><p style="white-space:pre-wrap">${escape(msg.message)}</p>`,
  });
  return true;
}
