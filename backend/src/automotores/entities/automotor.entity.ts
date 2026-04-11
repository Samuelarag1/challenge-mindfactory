import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SujetoEntity } from '../../sujetos/entities/sujeto.entity';

@Entity({ name: 'automotores' })
export class AutomotorEntity {
  @PrimaryColumn({ type: 'varchar', length: 7 })
  dominio!: string;

  @Column({ type: 'varchar', length: 60 })
  marca!: string;

  @Column({ type: 'varchar', length: 80 })
  modelo!: string;

  @Column({ name: 'fecha_fabricacion', type: 'varchar', length: 6 })
  fechaFabricacion!: string;

  @Column({ name: 'titular_cuit', type: 'varchar', length: 11 })
  titularCuit!: string;

  @ManyToOne(() => SujetoEntity, (sujeto) => sujeto.automotores, {
    nullable: false,
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'titular_cuit', referencedColumnName: 'cuit' })
  titular!: SujetoEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
