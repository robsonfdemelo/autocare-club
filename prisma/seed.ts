
import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const workshop = await prisma.workshop.create({
    data: {
      name: 'Honda Goiânia',
      slug: 'honda-goiania',
      description: 'Concessionária Honda especializada em revisões',
      imageUrl: 'https://via.placeholder.com/300',
      phone: '(62) 99999-9999',
      whatsapp: '5562999999999',
      address: 'Av. Exemplo, 123',
      city: 'Goiânia',
      state: 'GO',
    },
  })

  await prisma.revisionService.create({
    data: {
      name: 'Revisão 10.000 km',
      slug: 'revisao-10k',
      mileageTarget: 10000,
      priceDirect: 536.06,
      priceClub: 419.40,
      workshopId: workshop.id,
    },
  })

  await prisma.revisionService.create({
    data: {
      name: 'Revisão 20.000 km',
      slug: 'revisao-20k',
      mileageTarget: 20000,
      priceDirect: 650.0,
      priceClub: 520.0,
      workshopId: workshop.id,
    },
  })

  await prisma.planPackage.createMany({
    data: [
      {
        name: 'Plano 3 revisões',
        revisionsQty: 3,
        discountPct: 5,
        graceDays: 30,
      },
      {
        name: 'Plano 4 revisões',
        revisionsQty: 4,
        discountPct: 8,
        graceDays: 30,
      },
      {
        name: 'Plano 5 revisões',
        revisionsQty: 5,
        discountPct: 12,
        graceDays: 30,
      },
      {
        name: 'Plano 6 revisões',
        revisionsQty: 6,
        discountPct: 15,
        graceDays: 30,
      },
    ],
  })

  console.log('Seed executado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })