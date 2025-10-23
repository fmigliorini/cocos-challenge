import { MarketData } from 'src/modules/market-data/entities/market-data.entity';
import { Order } from 'src/modules/orders/entities/order.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InstrumentType } from '../instruments.type';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn({
    type: 'integer',
  })
  id: number;

  @Column({
    type: 'varchar',
    length: 10,
  })
  ticker: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 10,
  })
  type: InstrumentType; // 'ACCIONES' | 'MONEDA'

  @OneToMany(() => Order, order => order.instrumentId)
  orders!: Order[];

  @OneToMany(() => MarketData, md => md.instrumentId)
  marketData!: MarketData[];
}
