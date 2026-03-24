"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = __importStar(require("nodemailer"));
class EmailService {
    static initialize() {
        if (EmailService.hasDeliveryConfig() && !this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT),
                secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        }
    }
    static hasDeliveryConfig() {
        return Boolean(process.env.SMTP_HOST &&
            process.env.SMTP_PORT &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            process.env.EMAIL_FROM);
    }
    static getPublicUrl() {
        const vercelUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : undefined;
        return (process.env.PUBLIC_URL ||
            process.env.PUBLIC_APP_URL ||
            process.env.NEXTAUTH_URL ||
            vercelUrl ||
            'http://localhost:3000');
    }
    static async sendEmail(options) {
        EmailService.initialize();
        if (!this.transporter) {
            console.warn('Email delivery unavailable: SMTP provider not configured.', {
                to: options.to,
                subject: options.subject,
            });
            // In a real app, you might want to uncomment the line below to see email previews in development
            // console.log(`Email preview URL: ${EmailService.getPublicUrl()}/previews/emails/${Buffer.from(JSON.stringify(options)).toString('base64')}`);
            return false;
        }
        try {
            await this.transporter.sendMail({
                from: process.env.EMAIL_FROM,
                ...options,
            });
            console.log(`Email sent to ${options.to} with subject "${options.subject}"`);
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
            <a href="${EmailService.getPublicUrl()}/register/${invitationCode}" 
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
            text: `Hello ${name},\n\nYou've been invited to join ${schoolName} education platform.\n\nYour invitation code is: ${invitationCode}\n\nRegister at: ${EmailService.getPublicUrl()}/register/${invitationCode}\n\nThis invitation expires in 7 days.`
        });
    }
    static async sendPasswordResetEmail(email, name, token) {
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #ffc107; color: #212529; padding: 20px; border-radius: 8px; text-align: center;">
          <h1>Password Reset Request</h1>
        </div>
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password. If you didn't make this request, please ignore this email.</p>
          <p>To reset your password, click the link below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${EmailService.getPublicUrl()}/reset-password/${token}" 
               style="background-color: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 20px;">
            This link will expire in 1 hour.
          </p>
        </div>
        <div style="background-color: #343a40; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
          <p style="margin: 0;">© 2024 Education Platform. All rights reserved.</p>
        </div>
      </div>
    `;
        return this.sendEmail({
            to: email,
            subject: 'Password Reset Request',
            html,
            text: `Hello ${name},\n\nWe received a request to reset your password. If you didn't make this request, please ignore this email.\n\nTo reset your password, visit: ${EmailService.getPublicUrl()}/reset-password/${token}\n\nThis link will expire in 1 hour.`
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
            <a href="${EmailService.getPublicUrl()}/users/confirm-deletion/${deletionToken}" 
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
            text: `Hello ${name},\n\nA request was made to delete your account from ${schoolName} education platform.\n\nTo confirm deletion, visit: ${EmailService.getPublicUrl()}/users/confirm-deletion/${deletionToken}\n\nThis deletion is permanent and cannot be undone. You have 30 days to restore your account if you change your mind.\n\n© 2024 ${schoolName} Education Platform. All rights reserved.`
        });
    }
}
EmailService.transporter = null;
exports.default = EmailService;
