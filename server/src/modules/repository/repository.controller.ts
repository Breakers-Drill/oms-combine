import { Controller, Post, Body, Query } from '@nestjs/common';
import { RepositoryService } from './repository.service';

@Controller('api/repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) { }

  @Post('validate')
  async validateRepository(@Body() body: { repository: string }) {
    return this.repositoryService.validateRepository(body.repository);
  }

  @Post('branches')
  async getBranches(@Body() body: { repository: string }) {
    const branches = await this.repositoryService.getBranches(body.repository);
    return { branches };
  }

  @Post('analyze')
  async analyzeBranch(
    @Body() body: { repository: string; branch: string }
  ) {
    return this.repositoryService.analyzeBranch(body.repository, body.branch);
  }
}
