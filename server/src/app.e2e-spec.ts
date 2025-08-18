import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Определяем абсолютный путь к директории данных и удаляем папку сервиса
    const projectRoot = path.resolve(__dirname, '..', '..');
    const dataDir = path.resolve(projectRoot, process.env.DATA_DIR);
    const serviceDir = path.join(dataDir, 'oms-test');
    if (fs.existsSync(serviceDir)) {
      fs.rmSync(serviceDir, { recursive: true, force: true });
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/microservices (POST)', async () => {
    const createDto = {
      name: 'oms-test',
      repository: 'https://github.com/Breakers-Drill/oms-test.git',
      branch: 'master',
      environmentVariables: {},
    };

    const createResponse = await request(app.getHttpServer())
      .post('/api/microservices')
      .send(createDto);

    if (createResponse.status !== 201) {
      console.error('Error response body:', createResponse.body);
    }
    expect(createResponse.status).toBe(201);


    const microservice = createResponse.body;
    expect(microservice.id).toBeDefined();

    const deployResponse = await request(app.getHttpServer())
      .post(`/api/microservices/${microservice.id}/deploy`);

    if (deployResponse.status !== 201) {
      console.error('Error response body:', deployResponse.body);
    }
    expect(deployResponse.status).toBe(201);
  }, 30000);

  afterAll(async () => {
    await app.close();
  });
});
