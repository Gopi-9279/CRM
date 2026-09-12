const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('src/modules/**/*.service.ts');
console.log('Found files:', files.length);

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/import \{ PrismaClient \} from '@prisma\/client';\r?\n/, '');
  content = content.replace(/const prisma = new PrismaClient\(\);\r?\n/, '');
  content = `import { prisma } from '../../db/prisma';\n` + content;
  fs.writeFileSync(f, content);
  console.log('Updated', f);
});
