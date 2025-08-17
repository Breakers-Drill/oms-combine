import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MicroservicesService } from './microservices.service';
import type { Microservice, CreateMicroserviceDto } from '../../types/microservice.types';

@Controller('api/microservices')
export class MicroservicesController {
  constructor(private readonly microservicesService: MicroservicesService) { }

  @Get()
  async getAllMicroservices(): Promise<Microservice[]> {
    return this.microservicesService.getAllMicroservices();
  }

  @Get(':id')
  async getMicroservice(@Param('id') id: string): Promise<Microservice | null> {
    return this.microservicesService.getMicroservice(id);
  }

  @Post()
  async createMicroservice(@Body() dto: CreateMicroserviceDto): Promise<Microservice> {
    return this.microservicesService.createMicroservice(dto);
  }

  @Post(':id/deploy')
  async deployMicroservice(@Param('id') id: string): Promise<{ message: string }> {
    await this.microservicesService.deployMicroservice(id);
    return { message: `Microservice '${id}' deployment initiated` };
  }

  @Post(':id/stop')
  async stopMicroservice(@Param('id') id: string): Promise<{ message: string }> {
    await this.microservicesService.stopMicroservice(id);
    return { message: `Microservice '${id}' stop initiated` };
  }

  @Delete(':id')
  async deleteMicroservice(@Param('id') id: string): Promise<{ message: string }> {
    await this.microservicesService.deleteMicroservice(id);
    return { message: `Microservice '${id}' deletion initiated` };
  }
}
