import { Instrument } from 'src/modules/instruments/entities/instrument.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('marketdata')
export class MarketData {
  @PrimaryGeneratedColumn({
    type: 'integer',
  })
  id: number;

  @Column({
    name: 'instrumentid',
    type: 'integer',
  })
  instrumentId: number;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  high: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  low: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  open: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  close: string;

  @Column({
    name: 'previousclose',
    type: 'numeric',
    precision: 10,
    scale: 2,
  })
  previousClose: string;

  @Column({
    type: 'date',
    default: () => 'now()',
  })
  date: string;

  @ManyToOne(() => Instrument, (instrument) => instrument.marketData)
  @JoinColumn({ name: 'instrumentid' })
  instrument!: Instrument;
}
