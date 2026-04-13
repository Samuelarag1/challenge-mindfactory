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

@Entity({ name: 'automotores' })
export class VehicleEntity {
  @PrimaryColumn({ name: 'dominio', type: 'varchar', length: 7 })
  licensePlate!: string;

  @Column({ name: 'chasis', type: 'varchar', length: 30 })
  chassis!: string;

  @Column({ name: 'motor', type: 'varchar', length: 30 })
  engine!: string;

  @Column({ name: 'color', type: 'varchar', length: 40 })
  color!: string;

  @Column({ name: 'fecha_fabricacion', type: 'date' })
  manufactureDate!: string;

  @Column({ name: 'titular_cuit', type: 'varchar', length: 11 })
  ownerCuit!: string;

  @ManyToOne(() => OwnerEntity, (owner) => owner.vehicles, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'titular_cuit', referencedColumnName: 'cuit' })
  owner!: OwnerEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
