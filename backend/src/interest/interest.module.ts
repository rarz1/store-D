import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Interest } from './interest.entity';
import { InterestService } from './interest.service';
import { InterestController } from './interest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Interest])],
  providers: [InterestService],
  controllers: [InterestController],
})
export class InterestModule {}
