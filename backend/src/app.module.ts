import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import b2Config from './config/b2.config';
import cloudinaryConfig from './config/cloudinary.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import swaggerConfig from './config/swagger.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { ActorsModule } from './modules/actors/actors.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { PhotosModule } from './modules/photos/photos.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RisksModule } from './modules/risks/risks.module';
import { MailModule } from './modules/mail/mail.module';
import { UsersModule } from './modules/users/users.module';
import { ZonesModule } from './modules/zones/zones.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Root module: configuration, Prisma, and domain feature modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, swaggerConfig, cloudinaryConfig, b2Config, jwtConfig],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AdminModule,
    ActorsModule,
    UsersModule,
    MailModule,
    AuthModule,
    ProjectsModule,
    RisksModule,
    ZonesModule,
    DocumentsModule,
    PhotosModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
