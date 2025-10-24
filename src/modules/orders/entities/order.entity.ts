import { Instrument } from 'src/modules/instruments/entities/instrument.entity';
import { Users } from 'src/modules/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from 'typeorm';
import { OrderSide, OrderStatus, OrderType } from '../orders.types';
import { DecimalAsStringTransformer } from 'src/infrastructure/database/transformers/decimal.transformer';

@Entity('orders')
@TableInheritance({ column: { type: 'varchar', name: 'type' } })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    name: 'instrumentid',
    type: 'integer',
  })
  instrumentId: number;

  @Column({
    name: 'userid',
    type: 'integer',
  })
  userId: number;

  @Column({
    type: 'integer',
  })
  size: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: new DecimalAsStringTransformer(),
  })
  price: string | null;

  @Column({
    type: 'varchar',
    length: 10,
  })
  type: OrderType; // 'MARKET' | 'LIMIT'

  @Column({
    type: 'varchar',
    length: 10,
  })
  side: OrderSide; // 'BUY'|'SELL'|'CASH_IN'|'CASH_OUT'

  @Column({
    type: 'varchar',
    length: 20,
  })
  status: OrderStatus; // 'NEW'|'FILLED'|'REJECTED'|'CANCELLED'

  @Column({
    type: 'timestamptz',
    default: () => 'now()',
  })
  datetime: Date;

  @ManyToOne(() => Instrument, (instrument) => instrument.orders)
  @JoinColumn({ name: 'instrumentid' })
  instrument: Instrument;

  @ManyToOne(() => Users, (user) => user.orders)
  @JoinColumn({ name: 'userid' })
  user: Users;
}
