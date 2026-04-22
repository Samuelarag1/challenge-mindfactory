import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OwnerEntity } from '../../sujetos/entities/sujeto.entity';
import {
  manufactureDateFromDatabase,
  manufactureDateToDatabase,
} from '../../common/utils/fecha-fabricacion.util';

@Entity({ name: 'automotores' })
export class VehicleEntity {
  @PrimaryColumn({ name: 'dominio', type: 'varchar', length: 7 })
  dominio!: string;

  @Column({ name: 'chasis', type: 'varchar', length: 30 })
  chasis!: string;

  @Column({ name: 'motor', type: 'varchar', length: 30 })
  motor!: string;

  @Column({ name: 'color', type: 'varchar', length: 40 })
  color!: string;

  @Column({
    name: 'fecha_fabricacion',
    type: 'date',
    transformer: {
      to: (value: string) => manufactureDateToDatabase(value),
      from: (value: string) => manufactureDateFromDatabase(value),
    },
  })
  fechaFabricacion!: string;

  @Column({ name: 'titular_cuit', type: 'varchar', length: 11 })
  titularCuit!: string;

  @ManyToOne(() => OwnerEntity, (owner) => owner.vehicles, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'titular_cuit', referencedColumnName: 'cuit' })
  titular!: OwnerEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
