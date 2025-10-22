import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  email: string;
  
  @Column({ length: 20 })
  accountNumber: string;
}
