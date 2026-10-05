import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@rskits.com' },
    update: { cpf: '00000000000' },
    create: {
      name: 'Administrador',
      email: 'admin@rskits.com',
      cpf: '00000000000',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  console.log('Seed concluído:');
  console.log('  ADMIN -> admin@rskits.com / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
