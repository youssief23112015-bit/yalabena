import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
import { DocumentType } from '../../common/enums/document-type.enum';

@Entity('employee_documents')
export class EmployeeDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  employee_id: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 500 })
  file_url: string;

  @Column({ type: 'enum', enum: DocumentType })
  document_type: DocumentType;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
