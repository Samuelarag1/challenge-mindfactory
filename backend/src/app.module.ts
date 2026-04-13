import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesModule } from './automotores/automotores.module';
import { VehicleEntity } from './automotores/entities/automotor.entity';
import { DatabaseSeedService } from './database/database-seed.service';
import { AlignAutomotoresSchema1744398000000 } from './database/migrations/1744398000000-align-automotores-schema.migration';
import { NormalizeManufactureDate1744488000000 } from './database/migrations/1744488000000-normalize-manufacture-date.migration';
import { OwnerEntity } from './sujetos/entities/sujeto.entity';
import { OwnersModule } from './sujetos/sujetos.module';

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
      synchronize: true,
      migrationsRun: (process.env.DB_MIGRATIONS_RUN ?? 'true') === 'true',
      migrations: [
        AlignAutomotoresSchema1744398000000,
        NormalizeManufactureDate1744488000000,
      ],
      retryAttempts: 10,
      retryDelay: 2000,
    }),
    TypeOrmModule.forFeature([OwnerEntity, VehicleEntity]),
    OwnersModule,
    VehiclesModule,
  ],
  providers: [DatabaseSeedService],
})
export class AppModule {}
