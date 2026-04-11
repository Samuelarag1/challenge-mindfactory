import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AutomotorEntity } from '../../automotores/entities/automotor.entity';

@Entity({ name: 'sujetos' })
export class SujetoEntity {
  @PrimaryColumn({ type: 'varchar', length: 11 })
  cuit!: string;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @OneToMany(() => AutomotorEntity, (automotor) => automotor.titular)
  automotores!: AutomotorEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
