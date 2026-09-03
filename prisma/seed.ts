/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TOOL_CATALOG } from "../src/lib/tool-catalog";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@convertflow.local")
    .trim()
    .toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", name },
    create: { email, passwordHash, role: "ADMIN", name },
  });
  console.log(`✔ admin user ready: ${admin.email} (role ${admin.role})`);

  // Import the built-in image converters so the Tool Builder shows real rows.
  let imported = 0;
  for (const tool of TOOL_CATALOG) {
    await prisma.tool.upsert({
      where: { slug: tool.slug },
      update: {},
      create: {
        slug: tool.slug,
        name: tool.name,
        category: tool.category,
        fromFormat: tool.fromFormat,
        toFormat: tool.toFormat,
        description: tool.description,
        longDescription: tool.longDescription,
        accept: tool.accept,
        engine: tool.engine,
        customScript: tool.customScript ?? "",
        status: tool.status,
        metaTitle: tool.metaTitle ?? null,
        metaDescription: tool.metaDescription ?? null,
        faq: JSON.stringify(tool.faq ?? []),
        featured: Boolean(tool.featured),
      },
    });
    imported++;
  }
  console.log(`✔ ${imported} image converters imported into Tool`);

  // A sample published post so the Blog CMS + /blog have content.
  const sampleSlug = "welcome-to-convertflow";
  await prisma.post.upsert({
    where: { slug: sampleSlug },
    update: {},
    create: {
      slug: sampleSlug,
      title: "Welcome to ConvertFlow",
      excerpt:
        "A quick tour of the private, browser-based file and PDF toolkit.",
      contentHtml:
        "<p>ConvertFlow runs every conversion in your browser — your files never touch a server. This post is seeded so the CMS has something to edit.</p><h2>What's inside</h2><p>Image converters, a 27-tool PDF suite, and this blog, all managed from the admin panel.</p>",
      status: "PUBLISHED",
      metaTitle: "Welcome to ConvertFlow",
      metaDescription:
        "A private, browser-based toolkit for converting files and editing PDFs.",
      faq: JSON.stringify([
        {
          question: "Is ConvertFlow really free?",
          answer: "Yes — no account, no watermark, no upload.",
        },
      ]),
      tags: JSON.stringify(["announcement"]),
      authorId: admin.id,
      publishedAt: new Date(),
    },
  });
  console.log(`✔ sample blog post ready: /blog/${sampleSlug}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
