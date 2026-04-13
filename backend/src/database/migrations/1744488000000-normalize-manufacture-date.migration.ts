import { MigrationInterface, QueryRunner } from 'typeorm';

export class NormalizeManufactureDate1744488000000
  implements MigrationInterface
{
  name = 'NormalizeManufactureDate1744488000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const hasVehiclesTable = await queryRunner.hasTable('automotores');
    const hasManufactureDateColumn = await queryRunner.hasColumn(
      'automotores',
      'fecha_fabricacion',
    );

    if (!hasVehiclesTable || !hasManufactureDateColumn) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "automotores"
      ALTER COLUMN "fecha_fabricacion" TYPE date
      USING CASE
        WHEN "fecha_fabricacion" ~ '^\\d{6}$'
          THEN to_date("fecha_fabricacion" || '01', 'YYYYMMDD')
        WHEN "fecha_fabricacion" ~ '^\\d{4}-\\d{2}-\\d{2}$'
          THEN "fecha_fabricacion"::date
        ELSE NULL
      END
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const hasVehiclesTable = await queryRunner.hasTable('automotores');
    const hasManufactureDateColumn = await queryRunner.hasColumn(
      'automotores',
      'fecha_fabricacion',
    );

    if (!hasVehiclesTable || !hasManufactureDateColumn) {
      return;
    }

    await queryRunner.query(`
      ALTER TABLE "automotores"
      ALTER COLUMN "fecha_fabricacion" TYPE character varying(10)
      USING to_char("fecha_fabricacion", 'YYYY-MM-DD')
    `);
  }
}
