import { DataType, newDb } from 'pg-mem';
import { DataSource } from 'typeorm';
import { AlignAutomotoresSchema1744398000000 } from './1744398000000-align-automotores-schema.migration';

type MigratedAutomotorRow = {
  dominio: string;
  chasis: string;
  motor: string;
  color: string;
  fecha_fabricacion: string;
  titular_cuit: string;
};

type ColumnMetadataRow = {
  column_name: string;
  is_nullable: 'YES' | 'NO';
};

describe('AlignAutomotoresSchema1744398000000', () => {
  it('migra un esquema legacy de automotores sin romper datos existentes', async () => {
    const db = newDb({
      autoCreateForeignKeyIndices: true,
    });

    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'PostgreSQL 16.0 on pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'challenge_mindfactory_test',
    });

    const dataSource = db.adapters.createTypeormDataSource({
      type: 'postgres',
      database: 'challenge_mindfactory_test',
      entities: [],
    }) as DataSource;

    await dataSource.initialize();

    await dataSource.query(`
      CREATE TABLE "sujetos" (
        "cuit" character varying(11) NOT NULL,
        "nombre" character varying(120) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_sujetos_cuit" PRIMARY KEY ("cuit")
      )
    `);
    await dataSource.query(`
      CREATE TABLE "automotores" (
        "dominio" character varying(7) NOT NULL,
        "marca" character varying(60) NOT NULL,
        "modelo" character varying(80) NOT NULL,
        "fecha_fabricacion" character varying(6) NOT NULL,
        "titular_cuit" character varying(11) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_automotores_dominio" PRIMARY KEY ("dominio"),
        CONSTRAINT "FK_legacy_automotores_titular" FOREIGN KEY ("titular_cuit") REFERENCES "sujetos"("cuit") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    await dataSource.query(`
      INSERT INTO "sujetos" ("cuit", "nombre")
      VALUES ('20123456786', 'Juan Perez')
    `);
    await dataSource.query(`
      INSERT INTO "automotores" ("dominio", "marca", "modelo", "fecha_fabricacion", "titular_cuit")
      VALUES ('AAA123', 'Ford', 'Fiesta', '201806', '20123456786')
    `);

    const migration = new AlignAutomotoresSchema1744398000000();
    const queryRunner = dataSource.createQueryRunner();

    await migration.up(queryRunner);

    const automotoresColumns: ColumnMetadataRow[] = await dataSource.query(`
      SELECT "column_name", "is_nullable"
      FROM "information_schema"."columns"
      WHERE "table_schema" = 'public' AND "table_name" = 'automotores'
    `);
    const migratedRows: MigratedAutomotorRow[] = await dataSource.query(`
      SELECT "dominio", "chasis", "motor", "color", "fecha_fabricacion", "titular_cuit"
      FROM "automotores"
    `);

    expect(automotoresColumns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          column_name: 'chasis',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          column_name: 'motor',
          is_nullable: 'NO',
        }),
        expect.objectContaining({
          column_name: 'color',
          is_nullable: 'NO',
        }),
      ]),
    );
    expect(
      automotoresColumns.find((column) => column.column_name === 'marca'),
    ).toBeUndefined();
    expect(
      automotoresColumns.find((column) => column.column_name === 'modelo'),
    ).toBeUndefined();
    expect(migratedRows).toEqual([
      {
        dominio: 'AAA123',
        chasis: 'LEGACY-CHS-AAA123',
        motor: 'LEGACY-MTR-AAA123',
        color: 'No informado',
        fecha_fabricacion: '201806',
        titular_cuit: '20123456786',
      },
    ]);

    await queryRunner.release();
    await dataSource.destroy();
  });
});
