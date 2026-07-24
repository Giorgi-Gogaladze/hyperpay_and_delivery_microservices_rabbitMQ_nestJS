import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from 'resend'

@Injectable()
export class MailService{
    private readonly resend: Resend;
    private readonly logger = new Logger(MailService.name);
    private readonly mailFrom: string;

    constructor(private readonly configService: ConfigService){
        this.resend = new Resend(
            configService.getOrThrow<string>('RESEND_API_KEY'),
        );
        this.mailFrom = configService.getOrThrow<string>('MAIL_FROM');
    }


    async sendPasswordResetEmail(to: string, resetToken: string): Promise<void>{
        const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
        const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

        const {error} = await this.resend.emails.send({
            from: this.mailFrom,
            to,
            subject: 'password reset',
            html: `
                <p>You requested a password reset.</p>
                <p><a href="${resetLink}">Click here to set a new password</a></p>
                <p>This link is valid for 15 minutes.</p>
            `, 
        });
         
        if (error) {
            this.logger.error(`Failed to send reset email to ${to}`, error);
            throw new Error('Failed to send password reset email');
        }
    }
}