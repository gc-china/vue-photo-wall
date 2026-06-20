import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 配置
// ============================================================
const PHOTOS_DIR = path.join(__dirname, 'public/photos');
const THUMBS_DIR = path.join(__dirname, 'public/thumbs');
const OUTPUT_FILE = path.join(__dirname, 'src/assets/photos.json');

// 支持的图片扩展名
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];
// 缩略图目标宽度（保持比例）
const THUMB_WIDTH = 400;
// 缩略图质量
const THUMB_QUALITY = 80;

// ============================================================
// 工具函数
// ============================================================

/**
 * 确保目录存在
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 递归扫描目录下所有图片文件
 * @param {string} dir - 起始目录
 * @returns {Array<{filePath: string, relativePath: string, category: string}>}
 */
function scanDirectory(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 递归扫描子目录
      results.push(...scanDirectory(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (IMAGE_EXTS.includes(ext)) {
        // relativePath 相对于 public/photos，例如 "上海动物园/xxx.jpeg"
        const relativePath = path.relative(PHOTOS_DIR, fullPath).replace(/\\/g, '/');
        const category = relativePath.split('/')[0];
        results.push({
          filePath: fullPath,
          relativePath,
          category
        });
      }
    }
  }
  return results;
}

/**
 * 美化文件名作为标题
 * @param {string} filename - 原始文件名（含扩展名）
 * @param {string} category - 分类名
 * @returns {string}
 */
function beautifyTitle(filename, category) {
  const baseName = path.basename(filename, path.extname(filename));
  // 纯数字时间戳命名 -> 用分类名 + 简短序号
  if (/^\d{10,}$/.test(baseName)) {
    return category;
  }
  // 替换下划线/连字符为空格，首字母大写
  return baseName
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * 生成唯一 ID（基于分类+文件名）
 * @param {string} relativePath
 * @returns {string}
 */
function generateId(relativePath) {
  return relativePath
    .replace(/\.[^/.]+$/, '')
    .replace(/[\\/\s]+/g, '_')
    .replace(/_+/g, '_');
}

/**
 * 将字节大小转为人类可读字符串
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化光圈值 f/x.x
 * @param {*} fNumber
 * @returns {string}
 */
function formatAperture(fNumber) {
  if (fNumber == null || isNaN(fNumber)) return '';
  return `f/${Number(fNumber).toFixed(1)}`;
}

/**
 * 格式化快门速度
 * @param {*} exposureTime - 秒
 * @returns {string}
 */
function formatShutterSpeed(exposureTime) {
  if (exposureTime == null || isNaN(exposureTime)) return '';
  if (exposureTime >= 1) {
    return `${exposureTime}s`;
  }
  // 转为分数表示，例如 1/125
  const denominator = Math.round(1 / exposureTime);
  return `1/${denominator}s`;
}

/**
 * 格式化焦段
 * @param {*} focalLength
 * @returns {string}
 */
function formatFocalLength(focalLength) {
  if (focalLength == null || isNaN(focalLength)) return '';
  return `${Math.round(focalLength)}mm`;
}

// ============================================================
// 主处理逻辑
// ============================================================

/**
 * 处理单张图片：生成缩略图、提取 EXIF 元数据
 * @param {{filePath: string, relativePath: string, category: string}} photoInfo
 * @returns {Promise<Object|null>}
 */
async function processPhoto(photoInfo) {
  const { filePath, relativePath, category } = photoInfo;
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();

  // 缩略图输出路径（保持子目录结构，统一 .jpg 扩展名）
  const thumbRelativePath = relativePath.replace(/\.[^/.]+$/, '.jpg');
  const thumbFullPath = path.join(THUMBS_DIR, thumbRelativePath);
  ensureDir(path.dirname(thumbFullPath));

  // 获取文件大小
  const stat = fs.statSync(filePath);

  // 默认日期使用文件修改时间
  let date = stat.mtime;
  let metadata = {
    camera: '',
    lens: '',
    focalLength: '',
    aperture: '',
    shutterSpeed: '',
    iso: '',
    width: 0,
    height: 0,
    size: formatFileSize(stat.size),
    location: '',
    coordinates: { lat: 0, lng: 0 }
  };

  try {
    // 1. 生成缩略图并获取图片尺寸
    const sharpImage = sharp(filePath, {
      // HEIC 支持需要 sharp 内置的 libvips 编译支持
      failOnError: false
    });

    // 获取原图元数据（宽高）
    const imageMeta = await sharpImage.metadata();
    metadata.width = imageMeta.width || 0;
    metadata.height = imageMeta.height || 0;

    // 生成缩略图（宽度 400px，保持比例）
    await sharpImage
      .resize(THUMB_WIDTH, null, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
      .toFile(thumbFullPath);

    // 2. 提取 EXIF 信息（图片格式才尝试）
    if (ext !== '.png' && ext !== '.webp') {
      try {
        const exif = await exifr.parse(filePath, {
          tiff: true,
          exif: true,
          gps: true
        });

        if (exif) {
          // 拍摄日期
          if (exif.DateTimeOriginal) {
            date = exif.DateTimeOriginal;
          } else if (exif.CreateDate) {
            date = exif.CreateDate;
          }

          // 相机型号
          const make = exif.Make || '';
          const model = exif.Model || '';
          metadata.camera = [make, model].filter(Boolean).join(' ').trim();

          // 镜头
          metadata.lens = exif.LensModel || exif.LensInfo || '';

          // 焦段
          metadata.focalLength = formatFocalLength(exif.FocalLength);

          // 光圈
          metadata.aperture = formatAperture(exif.FNumber);

          // 快门速度
          metadata.shutterSpeed = formatShutterSpeed(exif.ExposureTime);

          // ISO
          metadata.iso = exif.ISO != null ? String(exif.ISO) : '';

          // GPS 坐标
          if (exif.latitude != null && exif.longitude != null) {
            metadata.coordinates = {
              lat: parseFloat(exif.latitude.toFixed(6)),
              lng: parseFloat(exif.longitude.toFixed(6))
            };
            // 位置名称留空，实际项目可调用反向地理编码 API
            metadata.location = '';
          }
        }
      } catch (exifErr) {
        // EXIF 解析失败不影响缩略图生成
        console.warn(`  ⚠ EXIF 解析失败: ${fileName}`);
      }
    }
  } catch (err) {
    console.error(`  ✗ 处理失败 ${relativePath}: ${err.message}`);
    return null;
  }

  // 构建数据模型（与组件期望对齐）
  const photoData = {
    id: generateId(relativePath),
    image: `/photos/${relativePath}`,
    thumbnail: `/thumbs/${thumbRelativePath}`,
    title: beautifyTitle(fileName, category),
    description: '',
    date: date instanceof Date && !isNaN(date.getTime())
      ? date.toISOString()
      : stat.mtime.toISOString(),
    category,
    tags: [],
    isLivePhoto: false,
    metadata
  };

  return photoData;
}

/**
 * 主扫描函数
 */
async function scanPhotos() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  照片扫描管道启动');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`✗ 照片目录不存在: ${PHOTOS_DIR}`);
    return;
  }

  // 确保输出目录存在
  ensureDir(THUMBS_DIR);
  ensureDir(path.dirname(OUTPUT_FILE));

  // 递归扫描所有子目录
  console.log(`📁 扫描目录: ${PHOTOS_DIR}`);
  const photoFiles = scanDirectory(PHOTOS_DIR);
  console.log(`📊 发现 ${photoFiles.length} 张图片\n`);

  if (photoFiles.length === 0) {
    console.warn('⚠ 未找到任何图片文件');
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  const photos = [];
  let successCount = 0;
  let failCount = 0;

  // 逐张处理（串行，避免内存峰值）
  for (let i = 0; i < photoFiles.length; i++) {
    const photoInfo = photoFiles[i];
    const progress = `[${i + 1}/${photoFiles.length}]`;
    process.stdout.write(`${progress} 处理: ${photoInfo.relativePath} ... `);

    const result = await processPhoto(photoInfo);
    if (result) {
      photos.push(result);
      successCount++;
      console.log('✓');
    } else {
      failCount++;
      console.log('✗');
    }
  }

  // 按日期降序排序
  photos.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 写入 JSON
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2), 'utf-8');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  扫描完成`);
  console.log(`  ✓ 成功: ${successCount} 张`);
  if (failCount > 0) {
    console.log(`  ✗ 失败: ${failCount} 张`);
  }
  console.log(`  📁 数据已保存: ${OUTPUT_FILE}`);
  console.log(`  🖼 缩略图目录: ${THUMBS_DIR}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 执行
scanPhotos().catch((err) => {
  console.error('扫描过程中发生未捕获的错误:', err);
  process.exit(1);
});
