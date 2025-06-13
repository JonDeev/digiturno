import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Crear módulos
  const modulo1 = await prisma.module.create({
    data: {
      name: 'Módulo 1',
    },
  })

  const modulo2 = await prisma.module.create({
    data: {
      name: 'Módulo 2',
    },
  })

  // Crear servicio
  const service = await prisma.service.create({
    data: {
      name: 'Reclamar fórmula',
      code: 'A',
    },
  })

  // Crear usuarios
  await prisma.user.createMany({
    data: [
      {
        name: 'Admin',
        username: 'admin',
        password: 'admin123', // ⚠️ en producción usar hash
        role: 'ADMIN',
        numberId: 1001,
      },
      {
        name: 'Asesor 1',
        username: 'asesor1',
        password: 'asesor123', // ⚠️ en producción usar hash
        role: 'ADVISOR',
        numberId: 1002,
        moduleId: modulo1.id,
      },
    ],
  })
}

main()
  .then(() => {
    console.log('✅ Datos iniciales insertados.')
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
