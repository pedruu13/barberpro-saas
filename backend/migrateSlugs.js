const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateSlug = (name) => {
  const base = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const hash = Math.random().toString(36).substring(2, 6);
  return `${base}-${hash}`;
};

async function main() {
  console.log('Buscando lojas sem slug...');
  const shops = await prisma.shop.findMany({
    where: { slug: null }
  });

  for (const shop of shops) {
    const newSlug = generateSlug(shop.name);
    await prisma.shop.update({
      where: { id: shop.id },
      data: { slug: newSlug }
    });
    console.log(`Liderando "${shop.name}" com novo slug: ${newSlug}`);
  }

  console.log('Finalizado!');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
