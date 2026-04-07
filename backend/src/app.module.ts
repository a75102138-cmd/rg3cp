import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import cloudinaryConfig from './config/cloudinary.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import swaggerConfig from './config/swagger.config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ActorsModule } from './modules/actors/actors.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { DecisionsModule } from './modules/decisions/decisions.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ElementsModule } from './modules/elements/elements.module';
import { InterventionsModule } from './modules/interventions/interventions.module';
import { LabTestsModule } from './modules/lab-tests/lab-tests.module';
import { LogbooksModule } from './modules/logbooks/logbooks.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ObservationsModule } from './modules/observations/observations.module';
import { PathologiesModule } from './modules/pathologies/pathologies.module';
import { PhotosModule } from './modules/photos/photos.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { RisksModule } from './modules/risks/risks.module';
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
      load: [appConfig, databaseConfig, swaggerConfig, cloudinaryConfig, jwtConfig],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ActorsModule,
    ProjectsModule,
    ZonesModule,
    ElementsModule,
    MaterialsModule,
    ObservationsModule,
    PathologiesModule,
    DecisionsModule,
    InterventionsModule,
    LogbooksModule,
    LabTestsModule,
    DocumentsModule,
    PhotosModule,
    RisksModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
