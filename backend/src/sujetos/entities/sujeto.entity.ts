import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleEntity } from '../../automotores/entities/automotor.entity';

@Entity({ name: 'sujetos' })
export class OwnerEntity {
  @PrimaryColumn({ type: 'varchar', length: 11 })
  cuit!: string;

  @Column({ name: 'nombre', type: 'varchar', length: 120 })
  name!: string;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.owner)
  vehicles!: VehicleEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
