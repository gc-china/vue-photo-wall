/* scan.js - 性能优化版 (生成缩略图) */
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp'; // 引入 sharp

const PHOTOS_DIR = './public/photos';
const THUMBS_DIR = './public/thumbs'; // 缩略图存放位置
const OUTPUT_FILE = './src/assets/photos.json';

// 确保目录存在
if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });

function formatExposureTime(t) {
    if (!t) return '-';
    if (t >= 1) return t + 's';
    const fraction = Math.round(1 / t);
    return `1/${fraction}`;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 简单的 Exif 字典映射
const ExifMap = {
    ExposureProgram: { 0: '未知', 1: '手动', 2: '标准程序', 3: '光圈优先', 4: '快门优先', 5: '景深优先', 6: '运动模式', 7: '肖像模式', 8: '风景模式' },
    MeteringMode: { 0: '未知', 1: '平均', 2: '中央重点', 3: '点测光', 4: '多点', 5: '矩阵/多区', 255: '其他' },
    WhiteBalance: { 0: '自动', 1: '手动' },
    SensingMethod: { 1: '未定义', 2: '单芯片彩色区域传感器', 3: '双芯片彩色区域传感器' }
};

function mapExifValue(key, value) {
    if (value === undefined || value === null) return '-';
    if (typeof value === 'string') return value;
    if (ExifMap[key] && ExifMap[key][value]) return ExifMap[key][value];
    return value;
}

function getFlashStatus(val) {
    if (val === undefined) return '-';
    return (val & 1) ? '开启' : '关闭';
}

async function generateThumbnail(filePath, relativePath) {
    const thumbPath = path.join(THUMBS_DIR, relativePath);
    const thumbDir = path.dirname(thumbPath);

    // 确保子文件夹存在
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    // 如果缩略图已存在且源文件没修改，跳过
    if (fs.existsSync(thumbPath)) {
        const srcStat = fs.statSync(filePath);
        const thumbStat = fs.statSync(thumbPath);
        if (srcStat.mtime <= thumbStat.mtime) return;
    }

    // 生成缩略图：宽度限制为 400px，高度自适应，质量 80%
    try {
        await sharp(filePath)
            .resize(400, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(thumbPath);
        console.log(`✨ 生成缩略图: ${relativePath}`);
    } catch (err) {
        console.error(`❌ 缩略图生成失败: ${relativePath}`, err.message);
    }
}

async function scanPhotos() {
    const dirPath = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

    const albums = fs.readdirSync(PHOTOS_DIR).filter(item => {
        return fs.statSync(path.join(PHOTOS_DIR, item)).isDirectory();
    });

    let allPhotos = [];

    console.log('🚀 开始扫描并生成缩略图 (首次运行可能较慢)...');

    for (const album of albums) {
        const albumPath = path.join(PHOTOS_DIR, album);
        const files = fs.readdirSync(albumPath).filter(f => /\.(jpg|jpeg|png|webp|heic)$/i.test(f));

        for (const file of files) {
            const filePath = path.join(albumPath, file);
            const relativePath = `${album}/${file}`;
            const stats = fs.statSync(filePath);

            // 1. 生成缩略图
            await generateThumbnail(filePath, relativePath);

            let photoData = {
                id: Math.random().toString(36).substr(2, 9),
                url: `photos/${relativePath}`,      // 原图路径
                thumb: `thumbs/${relativePath}`,    // 缩略图路径
                name: file,
                category: album,
                date: stats.mtime,
                size: formatFileSize(stats.size),
                width: 0,
                height: 0,
                exif: {}
            };

            try {
                const metadata = await exifr.parse(filePath, {
                    tiff: true, exif: true, gps: true, mergeOutput: true
                });

                if (metadata) {
                    photoData.date = metadata.DateTimeOriginal || metadata.CreateDate || stats.mtime;
                    photoData.width = metadata.ExifImageWidth || metadata.ImageWidth || 0;
                    photoData.height = metadata.ExifImageHeight || metadata.ImageHeight || 0;

                    const cleanMake = (metadata.Make || '').replace('CORPORATION', '').trim();

                    photoData.exif = {
                        make: cleanMake,
                        model: (metadata.Model || '').replace(cleanMake, '').trim(),
                        software: metadata.Software || '-',
                        focal: metadata.FocalLength ? `${Math.round(metadata.FocalLength)}mm` : '-',
                        fstop: metadata.FNumber ? `f/${metadata.FNumber}` : '-',
                        iso: metadata.ISO ? `${metadata.ISO}` : '-',
                        shutter: formatExposureTime(metadata.ExposureTime),
                        lens: metadata.LensModel || metadata.Lens || '-',
                        focal35: metadata.FocalLengthIn35mmFormat ? `${metadata.FocalLengthIn35mmFormat}mm` : '-',
                        whiteBalance: mapExifValue('WhiteBalance', metadata.WhiteBalance),
                        exposureProgram: mapExifValue('ExposureProgram', metadata.ExposureProgram),
                        meteringMode: mapExifValue('MeteringMode', metadata.MeteringMode),
                        flash: getFlashStatus(metadata.Flash),
                        brightness: metadata.BrightnessValue ? metadata.BrightnessValue.toFixed(2) : '-',
                        exposureBias: metadata.ExposureBiasValue ? `${metadata.ExposureBiasValue > 0 ? '+' : ''}${metadata.ExposureBiasValue} EV` : '0 EV',
                        sensingMethod: mapExifValue('SensingMethod', metadata.SensingMethod),
                        gps: (metadata.latitude && metadata.longitude) ? { lat: metadata.latitude, lng: metadata.longitude } : null
                    };
                }
            } catch (e) {
                // console.warn(e);
            }
            allPhotos.push(photoData);
        }
    }

    allPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPhotos, null, 2));
    console.log(`✅ 处理完成！共 ${allPhotos.length} 张照片。`);
}

scanPhotos();
