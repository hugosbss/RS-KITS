import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UserRole } from '../src/prisma/enums/user-role.enum';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const TEST_EMAIL = 'teste-e2e@rskits.com';
  const TEST_CPF = '333.333.333-33';
  const TEST_PASSWORD = 'senha123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.upsert({
      where: { email: TEST_EMAIL },
      update: {},
      create: {
        name: 'Usuário de Teste E2E',
        email: TEST_EMAIL,
        cpf: TEST_CPF,
        passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
        role: UserRole.OPERATOR,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await app.close();
  });

  describe('POST /api/auth/login', () => {
    it('deve retornar 200 e um token JWT ao autenticar por e-mail', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
      expect(response.body.user).toMatchObject({
        email: TEST_EMAIL,
        cpf: TEST_CPF,
        role: UserRole.OPERATOR,
      });
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('deve retornar 200 e um token JWT ao autenticar por CPF', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: TEST_CPF, password: TEST_PASSWORD })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body.user.email).toBe(TEST_EMAIL);
    });

    it('deve retornar 401 com senha incorreta', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: TEST_EMAIL, password: 'senha-errada' })
        .expect(401);
    });

    it('deve retornar 401 com identificador inexistente', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: 'nao-existe@rskits.com', password: TEST_PASSWORD })
        .expect(401);
    });

    it('deve retornar 400 com corpo inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ identifier: '', password: '123' })
        .expect(400);
    });
  });
});
