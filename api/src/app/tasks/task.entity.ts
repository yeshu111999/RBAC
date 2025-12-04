import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Organization } from '../organizations/organization.entity';
  import { User } from '../users/user.entity';
  import { TaskStatus } from './task-status.enum';
  import { TaskCategory } from './task-category.enum';
  
  @Entity()
  export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column()
    title: string;
  
    @Column({ type: 'text', nullable: true })
    description?: string | null;
  
    @Column({
      type: 'enum',
      enum: TaskStatus,
      default: TaskStatus.TODO,
    })
    status: TaskStatus;
  
    @Column({
      type: 'enum',
      enum: TaskCategory,
      default: TaskCategory.OTHER,
    })
    category: TaskCategory;
  
    // The org that owns this task
    @ManyToOne(() => Organization, { nullable: true })
    organization?: Organization | null;
  
    // Who created the task
    @ManyToOne(() => User, { nullable: true })
    createdBy?: User | null;

    @ManyToOne(() => User, { nullable: true })
    assignedTo?: User | null;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  