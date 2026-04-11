import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutomotoresModule } from './automotores/automotores.module';
import { AutomotorEntity } from './automotores/entities/automotor.entity';
import { DatabaseSeedService } from './database/database-seed.service';
import { SujetoEntity } from './sujetos/entities/sujeto.entity';
import { SujetosModule } from './sujetos/sujetos.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'challenge_mindfactory',
      autoLoadEntities: true,
      synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
      retryAttempts: 10,
      retryDelay: 2000,
    }),
    TypeOrmModule.forFeature([SujetoEntity, AutomotorEntity]),
    SujetosModule,
    AutomotoresModule,
  ],
  providers: [DatabaseSeedService],
})
export class AppModule {}
