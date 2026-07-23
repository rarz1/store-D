import { Controller, Get, Post, Body, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { InterestService } from './interest.service';
import { CreateInterestDto } from './interest.dto';
import { Interest } from './interest.entity';

@Controller('interest')
export class InterestController {
  constructor(private readonly interestService: InterestService) {}

  @Post()
  async create(@Body() dto: CreateInterestDto): Promise<Interest> {
    return this.interestService.create(dto);
  }

  @Get()
  async findAll(): Promise<Interest[]> {
    return this.interestService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.interestService.delete(Number(id));
  }
}
