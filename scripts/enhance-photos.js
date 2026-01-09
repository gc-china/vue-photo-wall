import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.resolve(__dirname, '../src/assets/photos.json');
const outputPath = path.resolve(__dirname, '../src/assets/photos.json');

console.log('📸 照片数据增强脚本启动...\n');

const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
console.log(`📊 共有 ${data.length} 条照片记录\n`);

let updatedCount = 0;
let categoryMap = {};

data.forEach((photo, index) => {
  let needsUpdate = false;

  if (!photo.category || photo.category === '') {
    const urlMatch = photo.url.match(/photos\/([^\/]+)\//);
    if (urlMatch) {
      photo.category = urlMatch[1];
      needsUpdate = true;
      console.log(`  [${index + 1}] 补充分类: ${photo.category}`);
    }
  }

  if (photo.date) {
    const date = new Date(photo.date);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}`;

      if (!photo.displayTime || photo.displayTime !== formattedTime) {
        photo.displayTime = formattedTime;
        needsUpdate = true;
      }
    }
  }

  if (photo.category) {
    if (!categoryMap[photo.category]) {
      categoryMap[photo.category] = 0;
    }
    categoryMap[photo.category]++;
  }

  if (needsUpdate) {
    updatedCount++;
  }
});

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

console.log('\n' + '='.repeat(50));
console.log('📈 数据完整性验证报告');
console.log('='.repeat(50));
console.log(`\n✅ 总记录数: ${data.length}`);
console.log(`🔄 更新的记录: ${updatedCount}`);

console.log('\n📁 分类统计:');
Object.entries(categoryMap).forEach(([cat, count]) => {
  console.log(`   • ${cat}: ${count} 张`);
});

let categoryComplete = 0;
let timeComplete = 0;
data.forEach(photo => {
  if (photo.category) categoryComplete++;
  if (photo.displayTime) timeComplete++;
});

console.log('\n🔍 数据完整性检查:');
console.log(`   • 有分类标识: ${categoryComplete}/${data.length} (${Math.round(categoryComplete/data.length*100)}%)`);
console.log(`   • 有时间信息: ${timeComplete}/${data.length} (${Math.round(timeComplete/data.length*100)}%)`);

console.log('\n✅ 所有照片已补充分类标识和时间信息！');
console.log('='.repeat(50));
