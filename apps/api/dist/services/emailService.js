"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Email service for sending notifications
const nodemailer_1 = __importDefault(require("nodemailer"));
class EmailService {
    static async initialize() {
        if (!this.transporter) {
            // For development, use ethereal test account
            this.transporter = nodemailer_1.default.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_USER || 'your-ethereal-email',
                    pass: process.env.EMAIL_PASS || 'your-ethereal-password',
                },
            });
            // For production with SendGrid
            // this.transporter = nodemailer.createTransport({
            //   host: 'smtp.sendgrid.net',
            //   port: 587,
            //   secure: false,
            //   auth: {
            //     user: process.env.SENDGRID_API_KEY,
            //     pass: process.env.SENDGRID_API_KEY,
            //   },
            // });
        }
    }
    static async sendEmail(options) {
        try {
            await this.initialize();
            const mailOptions = {
                from: process.env.EMAIL_FROM || 'noreply@eduplatform.ug',
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            };
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${options.to}: ${options.subject}`);
            return true;
        }
        catch (error) {
            console.error('Failed to send email:', error);
            return false;
        }
    }
    static async sendInvitationEmail(email, name, invitationCode, schoolName) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1>Welcome to ${schoolName}!</h1>
          <p>You have been invited to join our education platform.</p>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2>Hello ${name},</h2>
          <p>You've been invited to join the ${schoolName} education platform. Please use the invitation code below to complete your registration.</p>
          <div style="background-color: #e9ecef; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
            <h3 style="color: #495057; margin: 0;">Your Invitation Code:</h3>
            <div style="font-size: 24px; font-weight: bold; color: #007bff; letter-spacing: 2px; background: white; padding: 10px; border-radius: 4px;">
              ${invitationCode}
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="http://localhost:3000/register/${invitationCode}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Register Now
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
            This invitation will expire in 7 days.
          </p>
        </div>
        <div style="background-color: #343a40; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 ${schoolName} Education Platform. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendEmail({
            to: email,
            subject: `Invitation to join ${schoolName}`,
            html,
            text: `Hello ${name},\n\nYou've been invited to join ${schoolName} education platform.\n\nYour invitation code is: ${invitationCode}\n\nRegister at: http://localhost:3000/register/${invitationCode}\n\nThis invitation expires in 7 days.`
        });
    }
    static async sendDeletionConfirmationEmail(email, name, deletionToken, schoolName) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1>Account Deletion Request</h1>
          <p>We've received a request to delete your account.</p>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2>Hello ${name},</h2>
          <p>A request was made to delete your account from ${schoolName} education platform.</p>
          <p>If you did not make this request, please ignore this email.</p>
          <p>If you want to proceed with account deletion, please click the confirmation link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/users/confirm-deletion/${deletionToken}" 
               style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Confirm Account Deletion
            </a>
          </div>
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;"><strong>Important:</strong></p>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              <li>Account deletion is permanent and cannot be undone</li>
              <li>You have 30 days to restore your account if you change your mind</li>
              <li>All your data will be permanently deleted after the grace period</li>
            </ul>
          </div>
        </div>
        <div style="background-color: #343a40; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 ${schoolName} Education Platform. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendEmail({
            to: email,
            subject: 'Account Deletion Confirmation',
            html,
            text: `Hello ${name},\n\nA request was made to delete your account from ${schoolName} education platform.\n\nTo confirm deletion, visit: http://localhost:3000/users/confirm-deletion/${deletionToken}\n\nThis deletion is permanent and cannot be undone. You have 30 days to restore your account if you change your mind.\n\n© 2024 ${schoolName} Education Platform. All rights reserved.`
        });
    }
}
exports.default = EmailService;
