const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding reference data...')

  const rates = [
    { currencyCode: 'PKR', currencyName: 'Pakistani Rupee', exchangeRateToPKR: 1.00 },
    { currencyCode: 'USD', currencyName: 'US Dollar',       exchangeRateToPKR: 278.50 },
    { currencyCode: 'AED', currencyName: 'UAE Dirham',      exchangeRateToPKR: 75.80 },
    { currencyCode: 'EUR', currencyName: 'Euro',            exchangeRateToPKR: 301.20 },
    { currencyCode: 'GBP', currencyName: 'British Pound',   exchangeRateToPKR: 351.40 },
    { currencyCode: 'CNY', currencyName: 'Chinese Yuan',    exchangeRateToPKR: 38.40 },
  ]
  for (const r of rates) {
    await prisma.rate.upsert({ where: { currencyCode: r.currencyCode }, update: {}, create: r })
  }

  const taxRates = [
    { taxName: 'Standard GST',    taxRatePercent: 18, description: 'General Sales Tax Standard Rate' },
    { taxName: 'Reduced GST',     taxRatePercent: 5,  description: 'Reduced GST for specified categories' },
    { taxName: 'Zero Rated',      taxRatePercent: 0,  description: 'Zero-rated / exempted items' },
    { taxName: 'Withholding Tax', taxRatePercent: 10, description: 'WHT on applicable services' },
  ]
  const existingTaxRates = await prisma.taxRate.findMany({ select: { taxRateId: true, taxName: true } })
  const taxRateMap = new Map(existingTaxRates.map(t => [t.taxName, t.taxRateId]))
  for (const t of taxRates) {
    await prisma.taxRate.upsert({ where: { taxRateId: taxRateMap.get(t.taxName) ?? 0 }, update: {}, create: t })
  }

  const productTypes = [
    { typeName: 'Engine Parts' },
    { typeName: 'Electrical Components' },
    { typeName: 'Body Parts' },
    { typeName: 'Steam Cleaners' },
    { typeName: 'Consumables' },
    { typeName: 'Tools & Equipment' },
  ]
  const existingTypes = await prisma.productType.findMany({ select: { typeId: true, typeName: true } })
  const typeMap = new Map(existingTypes.map(p => [p.typeName, p.typeId]))
  for (const p of productTypes) {
    await prisma.productType.upsert({ where: { typeId: typeMap.get(p.typeName) ?? 0 }, update: {}, create: p })
  }

  console.log('Done.')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
