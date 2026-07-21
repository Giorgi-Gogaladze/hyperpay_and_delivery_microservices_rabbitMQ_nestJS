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
            subject: 'password resotre',
            html: `
                <p>თქვენ მოითხოვეთ პაროლის აღდგენა.</p>
                <p><a href="${resetLink}">დააჭირეთ აქ ახალი პაროლის დასაყენებლად</a></p>
                <p>ეს ბმული ვალიდურია 15 წუთის განმავლობაში.</p>
            `, 
        });
         
        if (error) {
            this.logger.error(`Failed to send reset email to ${to}`, error);
            throw new Error('Failed to send password reset email');
        }
    }
}