const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding reference data...')
  await prisma.rate.createMany({ skipDuplicates: true, data: [
    { currencyCode: 'PKR', currencyName: 'Pakistani Rupee', exchangeRateToPKR: 1.00 },
    { currencyCode: 'USD', currencyName: 'US Dollar',       exchangeRateToPKR: 278.50 },
    { currencyCode: 'AED', currencyName: 'UAE Dirham',      exchangeRateToPKR: 75.80 },
    { currencyCode: 'EUR', currencyName: 'Euro',            exchangeRateToPKR: 301.20 },
    { currencyCode: 'GBP', currencyName: 'British Pound',   exchangeRateToPKR: 351.40 },
    { currencyCode: 'CNY', currencyName: 'Chinese Yuan',    exchangeRateToPKR: 38.40 },
  ]})
  await prisma.taxRate.createMany({ skipDuplicates: true, data: [
    { taxName: 'Standard GST',    taxRatePercent: 18, description: 'General Sales Tax Standard Rate' },
    { taxName: 'Reduced GST',     taxRatePercent: 5,  description: 'Reduced GST for specified categories' },
    { taxName: 'Zero Rated',      taxRatePercent: 0,  description: 'Zero-rated / exempted items' },
    { taxName: 'Withholding Tax', taxRatePercent: 10, description: 'WHT on applicable services' },
  ]})
  await prisma.productType.createMany({ skipDuplicates: true, data: [
    { typeName: 'Engine Parts' },
    { typeName: 'Electrical Components' },
    { typeName: 'Body Parts' },
    { typeName: 'Steam Cleaners' },
    { typeName: 'Consumables' },
    { typeName: 'Tools & Equipment' },
  ]})
  console.log('Done.')
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
