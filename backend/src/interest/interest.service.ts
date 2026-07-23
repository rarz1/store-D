import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interest } from './interest.entity';
import { CreateInterestDto } from './interest.dto';

@Injectable()
export class InterestService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestRepo: Repository<Interest>,
  ) {}

  async create(dto: CreateInterestDto): Promise<Interest> {
    const interest = this.interestRepo.create(dto);
    return this.interestRepo.save(interest);
  }

  async findAll(): Promise<Interest[]> {
    return this.interestRepo.find();
  }

  async delete(id: number): Promise<void> {
    await this.interestRepo.delete(id);
  }
}
