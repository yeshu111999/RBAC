import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Organization } from '../organizations/organization.entity';
  import { Role } from '../auth/role.enum';
  
  @Entity()
  export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    passwordHash: string;
  
    @Column()
    name: string;
  
    @Column({
      type: 'enum',
      enum: Role,
      default: Role.VIEWER,
    })
    role: Role;
  
    @ManyToOne(() => Organization, { nullable: true })
    organization?: Organization | null;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  