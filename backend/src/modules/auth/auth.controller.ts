import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../users/users.service';
import { JwtRequestUser } from './auth.types';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { VerifyInvitationDto } from './dto/verify-invitation.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Connexion (JWT)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Inscription (création compte USER)' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Utilisateur connecté' })
  me(@CurrentUser() user: JwtRequestUser) {
    return this.usersService.findPublicById(user.sub);
  }

  @Public()
  @Post('invitations/verify')
  @ApiOperation({ summary: 'Vérifier un token d’invitation' })
  verifyInvitation(@Body() dto: VerifyInvitationDto) {
    return this.usersService.getInvitationByToken(dto.token);
  }

  @Public()
  @Post('invitations/accept')
  @ApiOperation({ summary: 'Accepter une invitation et définir un mot de passe' })
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.usersService.acceptInvitation(dto.token, dto.password);
  }
}
