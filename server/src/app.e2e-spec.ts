import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let microservice: any;

  beforeAll(async () => {

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create and deploy a microservice', async () => {
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

    microservice = createResponse.body;
    expect(microservice.id).toBeDefined();

    const deployResponse = await request(app.getHttpServer()).post(
      `/api/microservices/${microservice.id}/deploy`,
    );

    if (deployResponse.status !== 201) {
      console.error('Error response body:', deployResponse.body);
    }
    expect(deployResponse.status).toBe(201);
  }, 30000);

  it('should delete a microservice', async () => {
    const getResponse = await request(app.getHttpServer()).get(
      '/api/microservices',
    );
    expect(getResponse.status).toBe(200);
    const microservices = getResponse.body;
    const microserviceToDelete = microservices.find(
      (ms) => ms.name === 'oms-test',
    );
    expect(microserviceToDelete).toBeDefined();

    const deleteResponse = await request(app.getHttpServer()).delete(
      `/api/microservices/${microserviceToDelete.id}`,
    );

    if (deleteResponse.status !== 200) {
      console.error('Error response body:', deleteResponse.body);
    }
    expect(deleteResponse.status).toBe(200);

    // Проверяем, что контейнеры Docker также удалены
    const containersResponse = await request(app.getHttpServer()).get(
      '/api/microservices',
    );
    const remainingContainers = containersResponse.body.filter(
      (ms) => ms.name === 'oms-test',
    );
    expect(remainingContainers.length).toBe(0);
  }, 30000);


  afterAll(async () => {
    await app.close();
  });
});
