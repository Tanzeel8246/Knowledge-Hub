import fs from 'fs';
import path from 'path';

const schemaDir = path.join(process.cwd(), 'lib/db/src/schema');
const files = fs.readdirSync(schemaDir).filter(f => f.endsWith('.ts') && f !== 'index.ts');

for (const file of files) {
  const filePath = path.join(schemaDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace pg-core with mysql-core
  content = content.replace(/drizzle-orm\/pg-core/g, 'drizzle-orm/mysql-core');
  
  // Replace pgTable with mysqlTable
  content = content.replace(/pgTable/g, 'mysqlTable');
  
  // Replace uuid with varchar
  content = content.replace(/uuid\(/g, 'varchar(');
  content = content.replace(/varchar\("([^"]+)"\)\.primaryKey\(\)\.defaultRandom\(\)/g, 'varchar("$1", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID())');
  content = content.replace(/varchar\("([^"]+)"\)/g, 'varchar("$1", { length: 36 })');

  // Replace integer with int
  content = content.replace(/integer\(/g, 'int(');
  
  // Fix imports
  if (content.includes('mysqlTable')) {
    content = content.replace(/import \{([^}]+)\} from "drizzle-orm\/mysql-core";/, (match, p1) => {
      let imports = p1.split(',').map(i => i.trim());
      imports = imports.map(i => i === 'uuid' ? 'varchar' : i);
      imports = imports.map(i => i === 'integer' ? 'int' : i);
      // Remove duplicates
      imports = [...new Set(imports)];
      // Add crypto import if using randomUUID
      return `import { ${imports.join(', ')} } from "drizzle-orm/mysql-core";`;
    });
  }

  // Add crypto import at the top if needed
  if (content.includes('crypto.randomUUID()') && !content.includes('import crypto')) {
    content = `import crypto from "crypto";\n` + content;
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}

// Update index.ts
const indexTsPath = path.join(process.cwd(), 'lib/db/src/index.ts');
let indexTs = fs.readFileSync(indexTsPath, 'utf8');
indexTs = `import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema, mode: "default" });

export * from "./schema";
`;
fs.writeFileSync(indexTsPath, indexTs);
console.log('Updated index.ts');
