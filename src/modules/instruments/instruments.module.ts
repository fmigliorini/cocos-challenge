import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { Instrument } from './entities/instrument.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Instrument])],
  providers: [],
  exports: [],
})
export class InstrumentsModule {}
