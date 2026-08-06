import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Organização Demo',
      slug: 'demo',
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@sportdelivery.com' },
    update: {},
    create: {
      email: 'admin@sportdelivery.com',
      passwordHash,
      name: 'Administrador',
      role: UserRole.ADMIN,
      organizationId: org.id,
    },
  });

  const operatorHash = await bcrypt.hash('operador123', 10);

  await prisma.user.upsert({
    where: { email: 'operador@sportdelivery.com' },
    update: {},
    create: {
      email: 'operador@sportdelivery.com',
      passwordHash: operatorHash,
      name: 'Operador Demo',
      role: UserRole.OPERATOR,
      organizationId: org.id,
    },
  });

  const event = await prisma.event.upsert({
    where: { slug: 'corrida-demo-2026' },
    update: {},
    create: {
      name: 'Corrida Demo 2026',
      slug: 'corrida-demo-2026',
      organizationId: org.id,
      startDate: new Date('2026-08-15'),
    },
  });

  const athleteCount = await prisma.athlete.count({ where: { eventId: event.id } });

  if (athleteCount === 0) {
    await prisma.athlete.createMany({
      data: [
        {
          eventId: event.id,
          num: 1456,
          name: 'João Silva',
          cpf: '12345678901',
          category: 'Geral',
          distance: '10 km',
          city: 'São Paulo/SP',
          deliveryStatus: 'PENDING',
        },
        {
          eventId: event.id,
          num: 1457,
          name: 'Maria Santos',
          cpf: '98765432100',
          category: 'Feminino',
          distance: '5 km',
          city: 'Campinas/SP',
          deliveryStatus: 'PENDING',
        },
      ],
    });
  }

  console.log('Seed concluído.');
  console.log('Admin: admin@sportdelivery.com / admin123');
  console.log('Operador: operador@sportdelivery.com / operador123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
