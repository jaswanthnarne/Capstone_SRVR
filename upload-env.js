const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env file not found');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split(/\r?\n/);

for (let line of lines) {
  line = line.trim();
  if (line && !line.startsWith('#') && line.includes('=')) {
    const idx = line.indexOf('=');
    const key = line.substring(0, idx).trim();
    let val = line.substring(idx + 1).trim();
    
    // Remove wrapping quotes if present
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.substring(1, val.length - 1);
    }
    
    if (key !== 'PORT' && key !== 'TEST_VAR') {
      console.log(`Setting ${key}...`);
      
      // Remove first to avoid prompts or collisions
      try {
        execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
      } catch (err) {}
      
      // Add the new one cleanly via stdin
      execSync(`npx vercel env add ${key} production`, { input: val });
    }
  }
}

console.log('🎉 Environment variables updated successfully!');
