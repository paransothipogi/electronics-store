const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    const mailOptions = {
      from: `ElectroStore <${process.env.SMTP_EMAIL}>`,
      to: options.email,
      subject: options.subject,
      html: options.message
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

// Email templates
const emailTemplates = {
  welcome: (name) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #FF6B35;">Welcome to ElectroStore!</h2>
      <p>Hi ${name},</p>
      <p>Welcome to ElectroStore! We're excited to have you as part of our community.</p>
      <p>Start exploring our amazing collection of electronics and tech gadgets.</p>
      <p>Happy shopping!</p>
      <p>Best regards,<br>The ElectroStore Team</p>
    </div>
  `,
  
  orderConfirmation: (name, orderNumber, totalPrice) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #FF6B35;">Order Confirmation</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your order! Your order #${orderNumber} has been confirmed.</p>
      <p><strong>Total: $${totalPrice}</strong></p>
      <p>We'll send you another email when your order ships.</p>
      <p>Best regards,<br>The ElectroStore Team</p>
    </div>
  `,
  
  passwordReset: (name, resetUrl) => `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2 style="color: #FF6B35;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #FF6B35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 30 minutes.</p>
      <p>Best regards,<br>The ElectroStore Team</p>
    </div>
  `
};

module.exports = { sendEmail, emailTemplates };

