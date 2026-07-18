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
const MEDIUM_DIR = path.join(__dirname, 'public/medium');
const OUTPUT_FILE = path.join(__dirname, 'src/assets/photos.json');

// 支持的图片扩展名
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.heic', '.webp'];
// 缩略图目标宽度（保持比例）
const THUMB_WIDTH = 400;
// 缩略图质量
const THUMB_QUALITY = 80;
// 中等分辨率图目标宽度
const MEDIUM_WIDTH = 800;
// 中等分辨率图质量
const MEDIUM_QUALITY = 82;
// 原图解码开销高，默认 2 路并发兼顾速度与内存峰值，可通过环境变量覆盖。
const PROCESS_CONCURRENCY = Math.max(1, Math.min(4, Number(process.env.SCAN_CONCURRENCY) || 2));
const FORCE_REBUILD = process.argv.includes('--force');

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
 * @param {Date|string} [date] - 拍摄日期
 * @returns {string}
 */
function beautifyTitle(filename, category, date) {
  const baseName = path.basename(filename, path.extname(filename));

  // 纯数字时间戳 → 用分类名
  if (/^\d{10,}$/.test(baseName)) {
    return category;
  }

  // 数字+分隔符组合的时间戳类文件名（如 1725209555000_1726195314790_53）→ 用 "分类名 · 日期"
  if (/^\d+([_-]\d+)+$/.test(baseName)) {
    const d = date instanceof Date ? date : new Date(date);
    if (d && !isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      return `${category} · ${dateStr}`;
    }
    return category;
  }

  // hash 文件名（16位以上字母数字混合，类似 md5）→ 用 "分类名 · 日期" 格式
  if (/^[a-fA-F0-9]{16,}$/.test(baseName)) {
    const d = date instanceof Date ? date : new Date(date);
    if (d && !isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      return `${category} · ${dateStr}`;
    }
    return category;
  }

  // 正常有意义的文件名 → 美化
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

  // WebP 缩略图输出路径
  const thumbWebpRelativePath = relativePath.replace(/\.[^/.]+$/, '.webp');
  const thumbWebpFullPath = path.join(THUMBS_DIR, thumbWebpRelativePath);
  ensureDir(path.dirname(thumbWebpFullPath));

  // 中等分辨率图输出路径
  const mediumRelativePath = relativePath.replace(/\.[^/.]+$/, '.jpg');
  const mediumFullPath = path.join(MEDIUM_DIR, mediumRelativePath);
  ensureDir(path.dirname(mediumFullPath));

  // 中等分辨率 WebP 输出路径
  const mediumWebpFullPath = path.join(MEDIUM_DIR, thumbWebpRelativePath);
  ensureDir(path.dirname(mediumWebpFullPath));

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
    }).rotate();

    // 获取原图元数据（宽高）
    const imageMeta = await sharpImage.metadata();
    const swapsDimensions = imageMeta.orientation >= 5 && imageMeta.orientation <= 8;
    metadata.width = swapsDimensions ? (imageMeta.height || 0) : (imageMeta.width || 0);
    metadata.height = swapsDimensions ? (imageMeta.width || 0) : (imageMeta.height || 0);

    // 基于同一自动旋转管道派生四种预览，避免串行重复完整解码。
    await Promise.all([
      sharpImage.clone()
        .resize(THUMB_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
        .toFile(thumbFullPath),
      sharpImage.clone()
        .resize(THUMB_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toFile(thumbWebpFullPath),
      sharpImage.clone()
        .resize(MEDIUM_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: MEDIUM_QUALITY, mozjpeg: true })
        .toFile(mediumFullPath),
      sharpImage.clone()
        .resize(MEDIUM_WIDTH, null, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: MEDIUM_QUALITY })
        .toFile(mediumWebpFullPath)
    ]);

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
    thumbnailWebp: `/thumbs/${thumbWebpRelativePath}`,
    medium: `/medium/${mediumRelativePath}`,
    mediumWebp: `/medium/${thumbWebpRelativePath}`,
    title: beautifyTitle(fileName, category, date),
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
  ensureDir(MEDIUM_DIR);
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
  let reusedCount = 0;
  let processedCount = 0;
  let completedCount = 0;

  let previousById = new Map();
  if (!FORCE_REBUILD && fs.existsSync(OUTPUT_FILE)) {
    try {
      const previous = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
      previousById = new Map(previous.map(photo => [photo.id, photo]));
    } catch {
      console.warn('⚠ 旧索引无法读取，将重新处理全部照片');
    }
  }

  const canReuse = (photoInfo, previous) => {
    if (!previous) return false;
    const sourceMtime = fs.statSync(photoInfo.filePath).mtimeMs;
    const outputs = [previous.thumbnail, previous.thumbnailWebp, previous.medium, previous.mediumWebp]
      .map(file => file && path.join(__dirname, 'public', file.replace(/^\/+/, '')));
    return outputs.length === 4 && outputs.every(file =>
      file && fs.existsSync(file) && fs.statSync(file).mtimeMs >= sourceMtime
    );
  };

  const processAtIndex = async (index) => {
    const photoInfo = photoFiles[index];
    const id = generateId(photoInfo.relativePath);
    const previous = previousById.get(id);
    let result = null;

    if (canReuse(photoInfo, previous)) {
      result = previous;
      reusedCount++;
    } else {
      result = await processPhoto(photoInfo);
      processedCount++;
    }

    completedCount++;
    if (result) {
      photos.push(result);
      successCount++;
      console.log(`[${completedCount}/${photoFiles.length}] ✓ ${photoInfo.relativePath}${result === previous ? '（复用）' : ''}`);
    } else {
      failCount++;
      console.log(`[${completedCount}/${photoFiles.length}] ✗ ${photoInfo.relativePath}`);
    }
  };

  // 有界工作队列：比全串行更快，也避免一次解码全部大图造成内存峰值。
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(PROCESS_CONCURRENCY, photoFiles.length) },
    async () => {
      while (nextIndex < photoFiles.length) {
        const index = nextIndex++;
        await processAtIndex(index);
      }
    }
  );
  await Promise.all(workers);

  // 按日期降序排序
  photos.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 写入 JSON
  const tempOutput = `${OUTPUT_FILE}.tmp`;
  fs.writeFileSync(tempOutput, JSON.stringify(photos, null, 2), 'utf-8');
  fs.renameSync(tempOutput, OUTPUT_FILE);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  扫描完成`);
  console.log(`  ✓ 成功: ${successCount} 张`);
  console.log(`  ↻ 复用: ${reusedCount} 张`);
  console.log(`  ⚙ 重建: ${processedCount} 张`);
  if (failCount > 0) {
    console.log(`  ✗ 失败: ${failCount} 张`);
  }
  console.log(`  📁 数据已保存: ${OUTPUT_FILE}`);
  console.log(`  🖼 缩略图目录: ${THUMBS_DIR}`);
  console.log(`  🖼 中等图目录: ${MEDIUM_DIR}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// 执行
scanPhotos().catch((err) => {
  console.error('扫描过程中发生未捕获的错误:', err);
  process.exit(1);
});
