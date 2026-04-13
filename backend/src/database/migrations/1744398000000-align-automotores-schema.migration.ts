import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignAutomotoresSchema1744398000000 implements MigrationInterface {
  name = 'AlignAutomotoresSchema1744398000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.ensureOwnersTable(queryRunner);
    await this.ensureVehiclesTable(queryRunner);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('automotores')) {
      await queryRunner.query('DROP TABLE "automotores"');
    }

    if (await queryRunner.hasTable('sujetos')) {
      await queryRunner.query('DROP TABLE "sujetos"');
    }
  }

  private async ensureOwnersTable(queryRunner: QueryRunner) {
    const hasOwnersTable = await queryRunner.hasTable('sujetos');

    if (!hasOwnersTable) {
      await queryRunner.query(`
        CREATE TABLE "sujetos" (
          "cuit" character varying(11) NOT NULL,
          "nombre" character varying(120) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_sujetos_cuit" PRIMARY KEY ("cuit")
        )
      `);

      return;
    }

    await this.addColumnIfMissing(
      queryRunner,
      'sujetos',
      'created_at',
      'TIMESTAMPTZ NOT NULL DEFAULT now()',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'sujetos',
      'updated_at',
      'TIMESTAMPTZ NOT NULL DEFAULT now()',
    );
  }

  private async ensureVehiclesTable(queryRunner: QueryRunner) {
    const hasVehiclesTable = await queryRunner.hasTable('automotores');

    if (!hasVehiclesTable) {
      await queryRunner.query(`
        CREATE TABLE "automotores" (
          "dominio" character varying(7) NOT NULL,
          "chasis" character varying(30) NOT NULL,
          "motor" character varying(30) NOT NULL,
          "color" character varying(40) NOT NULL,
          "fecha_fabricacion" character varying(6) NOT NULL,
          "titular_cuit" character varying(11) NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          CONSTRAINT "PK_automotores_dominio" PRIMARY KEY ("dominio"),
          CONSTRAINT "FK_automotores_titular_cuit" FOREIGN KEY ("titular_cuit") REFERENCES "sujetos"("cuit") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `);

      return;
    }

    await this.addColumnIfMissing(
      queryRunner,
      'automotores',
      'chasis',
      'character varying(30)',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'automotores',
      'motor',
      'character varying(30)',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'automotores',
      'color',
      'character varying(40)',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'automotores',
      'created_at',
      'TIMESTAMPTZ NOT NULL DEFAULT now()',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'automotores',
      'updated_at',
      'TIMESTAMPTZ NOT NULL DEFAULT now()',
    );

    await queryRunner.query(`
      UPDATE "automotores"
      SET
        "chasis" = CASE
          WHEN "chasis" IS NULL OR "chasis" = '' THEN 'LEGACY-CHS-' || "dominio"
          ELSE "chasis"
        END,
        "motor" = CASE
          WHEN "motor" IS NULL OR "motor" = '' THEN 'LEGACY-MTR-' || "dominio"
          ELSE "motor"
        END,
        "color" = CASE
          WHEN "color" IS NULL OR "color" = '' THEN 'No informado'
          ELSE "color"
        END
      WHERE
        "chasis" IS NULL
        OR "motor" IS NULL
        OR "color" IS NULL
        OR "chasis" = ''
        OR "motor" = ''
        OR "color" = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "automotores"
      ALTER COLUMN "chasis" TYPE character varying(30),
      ALTER COLUMN "chasis" SET NOT NULL,
      ALTER COLUMN "motor" TYPE character varying(30),
      ALTER COLUMN "motor" SET NOT NULL,
      ALTER COLUMN "color" TYPE character varying(40),
      ALTER COLUMN "color" SET NOT NULL
    `);

    if (await queryRunner.hasColumn('automotores', 'marca')) {
      await queryRunner.query('ALTER TABLE "automotores" DROP COLUMN "marca"');
    }

    if (await queryRunner.hasColumn('automotores', 'modelo')) {
      await queryRunner.query('ALTER TABLE "automotores" DROP COLUMN "modelo"');
    }
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnDefinition: string,
  ) {
    const hasColumn = await queryRunner.hasColumn(tableName, columnName);

    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnDefinition}`,
      );
    }
  }
}
