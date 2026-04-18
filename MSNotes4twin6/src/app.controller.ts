import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';
import { WelcomeConfigService } from './welcome-config.service';

@Controller()
export class AppController {
  constructor(private readonly welcomeConfig: WelcomeConfigService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'UP' };
  }

  @Public()
  @Get('welcome')
  welcome() {
    return this.welcomeConfig.getWelcome();
  }
}
