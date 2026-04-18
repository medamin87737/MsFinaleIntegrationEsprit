import { Injectable } from '@nestjs/common';

@Injectable()
export class WelcomeConfigService {
  private readonly welcomeMessage =
    process.env.WELCOME_MESSAGE ?? 'Welcome to MSNotes4twin6 MS';

  getWelcome(): string {
    return this.welcomeMessage;
  }
}
