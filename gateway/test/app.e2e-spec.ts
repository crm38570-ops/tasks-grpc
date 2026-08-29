import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { config } from './../src/swagger-config';

interface OpenApiDocument {
  paths: Record<string, Record<string, OpenApiOperation>>;
}

interface OpenApiOperation {
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: OpenApiSchema;
      };
      'multipart/form-data'?: {
        schema?: OpenApiSchema;
      };
    };
  };
  parameters?: OpenApiParameter[];
}

interface OpenApiSchema {
  properties?: Record<string, OpenApiProperty>;
  required?: string[];
}

interface OpenApiProperty {
  enum?: string[];
}

interface OpenApiParameter {
  name: string;
  required?: boolean;
  schema?: OpenApiProperty;
}

describe('Gateway (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api-json (GET) exposes request fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/api-json')
      .expect(200);
    const document = response.body as OpenApiDocument;
    const signupSchema =
      document.paths['/auth/signup'].post.requestBody?.content?.[
        'application/json'
      ]?.schema;
    const createTaskSchema =
      document.paths['/tasks'].post.requestBody?.content?.['application/json']
        ?.schema;
    const updateStatusSchema =
      document.paths['/tasks/{id}/status'].patch.requestBody?.content?.[
        'application/json'
      ]?.schema;
    const taskQueryParameters = document.paths['/tasks'].get.parameters ?? [];
    const statusParameter = taskQueryParameters.find(
      (parameter) => parameter.name === 'status',
    );
    const searchParameter = taskQueryParameters.find(
      (parameter) => parameter.name === 'searchQuery',
    );
    const uploadSchema =
      document.paths['/files/upload'].post.requestBody?.content?.[
        'multipart/form-data'
      ]?.schema;

    expect(signupSchema?.required).toEqual(['username', 'password']);
    expect(Object.keys(signupSchema?.properties ?? {})).toEqual([
      'username',
      'password',
    ]);
    expect(createTaskSchema?.required).toEqual(['title', 'description']);
    expect(Object.keys(createTaskSchema?.properties ?? {})).toEqual([
      'title',
      'description',
    ]);
    expect(updateStatusSchema?.required).toEqual(['status']);
    expect(updateStatusSchema?.properties?.status?.enum).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'DONE',
    ]);
    expect(statusParameter?.required).toBe(false);
    expect(statusParameter?.schema?.enum).toEqual([
      'OPEN',
      'IN_PROGRESS',
      'DONE',
    ]);
    expect(searchParameter?.required).toBe(false);
    expect(uploadSchema?.properties?.file).toBeDefined();
    expect(uploadSchema?.properties?.taskId).toBeDefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
