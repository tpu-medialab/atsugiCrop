const fs = require('fs');
const path = require('path');

const TEMPLATE_FILE = path.join(__dirname, 'index.template.html');
const OUTPUT_FILE = path.join(__dirname, 'index.html');
const PLACEHOLDER = '{{GMAPS_API_KEY}}';

const main = () => {
  const apiKey = process.env.GMAPS_API_KEY;
  if (!apiKey) {
    console.error('環境変数 GMAPS_API_KEY が設定されていません');
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_FILE, 'utf8');
  const html = template.replace(PLACEHOLDER, apiKey);
  fs.writeFileSync(OUTPUT_FILE, html, 'utf8');
  console.log(`生成完了: ${OUTPUT_FILE}`);
};

main();
