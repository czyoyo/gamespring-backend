import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @ManyToOne(() => User)
  sender: User;

  @ManyToOne(() => User, { nullable: true })
  receiver: User;

  @Column({ default: 'public' })
  type: 'public' | 'private' | 'system';

  @Column({ nullable: true })
  roomId: string;

  @CreateDateColumn()
  createdAt: Date;
}
