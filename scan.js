/* scan.js - 修复版 (彻底解决后缀名不一致导致的 404) */
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import crypto from 'crypto';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const PHOTOS_DIR = './public/photos';
const THUMBS_DIR = './public/thumbs';
const GENERATED_DIR = './public/generated';
const OUTPUT_FILE = './src/assets/photos.json';

if (!fs.existsSync(THUMBS_DIR)) fs.mkdirSync(THUMBS_DIR, { recursive: true });
if (!fs.existsSync(GENERATED_DIR)) fs.mkdirSync(GENERATED_DIR, { recursive: true });

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const isVideo = (filename) => /\.(mov|mp4|webm)$/i.test(filename);
const isHeic = (filename) => /\.(heic|heif)$/i.test(filename);

// --- 核心修复：统一生成缩略图文件名的函数 ---
// 无论输入是什么 (a.jpg, b.jpeg, c.HEIC.mov)，输出都是 a.jpg, b.jpg, c.HEIC.jpg
const getThumbFilename = (originalFilename) => {
    return originalFilename + '.jpg';
    // 简单粗暴：直接在原文件名后加 .jpg，防止替换错误
    // 例如：image.jpeg -> image.jpeg.jpg
    // 这样能保证文件名绝对唯一，且不会因为正则替换出错
};

const getVideoMeta = (filePath) => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) resolve({ width: 0, height: 0, duration: 0 });
            else {
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                let width = videoStream ? videoStream.width : 0;
                let height = videoStream ? videoStream.height : 0;
                const rotation = videoStream?.tags?.rotate || videoStream?.tags?.js_rotate || 0;
                if (Math.abs(rotation - 90) < 1 || Math.abs(rotation - 270) < 1) {
                    [width, height] = [height, width];
                }
                resolve({ width, height, duration: metadata.format.duration || 0 });
            }
        });
    });
};

const processVideo = (filePath, album, filename) => {
    return new Promise((resolve) => {
        if (filename.toLowerCase().endsWith('.mp4')) { resolve(null); return; }
        const relativeOutput = `generated/${album}/${filename}.mp4`; // 统一命名规则
        const outputPath = path.join('./public', relativeOutput);
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
        if (fs.existsSync(outputPath)) { resolve(relativeOutput); return; }

        console.log(`🎬 转码中: ${filename}...`);
        ffmpeg(filePath)
            .outputOptions(['-c:v libx264', '-preset fast', '-crf 23', '-c:a aac', '-b:a 128k', '-movflags +faststart'])
            .save(outputPath)
            .on('end', () => resolve(relativeOutput))
            .on('error', () => resolve(null));
    });
};

const generateVideoThumbnail = async (videoPath, thumbPath) => {
    if (fs.existsSync(thumbPath)) return;
    const tempName = `temp_${path.basename(thumbPath)}`;
    const tempPath = path.join(path.dirname(thumbPath), tempName);
    const thumbDir = path.dirname(thumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    return new Promise((resolve) => {
        ffmpeg(videoPath)
            .screenshots({
                count: 1, folder: thumbDir, filename: tempName, timemarks: ['1']
            })
            .on('end', async () => {
                try {
                    await sharp(tempPath)
                        .resize(400, null, { fit: 'inside', withoutEnlargement: true })
                        .jpeg({ quality: 80, mozjpeg: true })
                        .toFile(thumbPath);
                    fs.unlinkSync(tempPath);
                    console.log(`📸 视频缩略图: ${path.basename(thumbPath)}`);
                } catch (e) { console.error(e); }
                resolve();
            })
            .on('error', () => resolve());
    });
};

async function processHeicImage(filePath, album, filename) {
    const relativeOutput = `generated/${album}/${filename}.jpg`;
    const outputPath = path.join('./public', relativeOutput);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(outputPath)) {
        try { await sharp(filePath).jpeg({ quality: 90 }).toFile(outputPath); } catch (err) { return null; }
    }
    return relativeOutput;
}

async function generateThumbnail(sourcePath, thumbPath) {
    if (fs.existsSync(thumbPath)) return;
    const thumbDir = path.dirname(thumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    try {
        await sharp(sourcePath)
            .resize(400, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(thumbPath);
        console.log(`✨ 图片缩略图: ${path.basename(thumbPath)}`);
    } catch (err) {}
}

async function scanPhotos() {
    if (!fs.existsSync(PHOTOS_DIR)) return;
    const albums = fs.readdirSync(PHOTOS_DIR).filter(item => fs.statSync(path.join(PHOTOS_DIR, item)).isDirectory());
    let allPhotos = [];

    console.log('🚀 开始扫描 (修复文件名 404 版)...');

    for (const album of albums) {
        const albumPath = path.join(PHOTOS_DIR, album);
        const files = fs.readdirSync(albumPath).filter(f => /\.(jpg|jpeg|png|webp|heic|mov|mp4)$/i.test(f));

        for (const file of files) {
            const filePath = path.join(albumPath, file);
            const stats = fs.statSync(filePath);
            const _isVideo = isVideo(file);
            const _isHeic = isHeic(file);

            let finalUrl = `photos/${album}/${file}`;

            // ✅ 核心修复：生成唯一的缩略图文件名 (原文件名 + .jpg)
            // 例如: photo.jpeg -> thumbs/album/photo.jpeg.jpg
            const thumbName = getThumbFilename(file);
            const thumbPath = path.join(THUMBS_DIR, album, thumbName);
            const thumbUrl = `thumbs/${album}/${thumbName}`;

            let width = 0; let height = 0;

            if (_isVideo) {
                const convertedVideo = await processVideo(filePath, album, file);
                if (convertedVideo) finalUrl = convertedVideo;
                const meta = await getVideoMeta(filePath);
                width = meta.width; height = meta.height;
                await generateVideoThumbnail(filePath, thumbPath);
            } else if (_isHeic) {
                const convertedPath = await processHeicImage(filePath, album, file);
                if (convertedPath) {
                    finalUrl = convertedPath;
                    await generateThumbnail(path.join('./public', convertedPath), thumbPath);
                }
            } else {
                await generateThumbnail(filePath, thumbPath);
            }

            let photoData = {
                id: crypto.createHash('md5').update(`${album}/${file}`).digest('hex').substring(0, 8),
                url: finalUrl,
                thumb: thumbUrl, // 现在的 thumbUrl 绝对和硬盘上的文件名一致
                name: file,
                category: album,
                date: stats.mtime,
                size: formatFileSize(stats.size),
                width: width, height: height,
                type: _isVideo ? 'video' : 'image',
                exif: {}
            };

            if (!_isVideo) {
                try {
                    const metadata = await exifr.parse(filePath, { tiff: true, exif: true, gps: true, mergeOutput: true });
                    if (metadata) {
                        photoData.date = metadata.DateTimeOriginal || metadata.CreateDate || stats.mtime;
                        photoData.width = metadata.ExifImageWidth || metadata.ImageWidth || width;
                        photoData.height = metadata.ExifImageHeight || metadata.ImageHeight || height;
                        const cleanMake = (metadata.Make || '').replace('CORPORATION', '').trim();
                        photoData.exif = {
                            make: cleanMake,
                            model: (metadata.Model || '').replace(cleanMake, '').trim(),
                            iso: metadata.ISO,
                            focal: metadata.FocalLength ? `${Math.round(metadata.FocalLength)}mm` : '-',
                            fstop: metadata.FNumber ? `f/${metadata.FNumber}` : '-',
                            shutter: metadata.ExposureTime ? (metadata.ExposureTime >= 1 ? metadata.ExposureTime : `1/${Math.round(1/metadata.ExposureTime)}`) : '-',
                            gps: (metadata.latitude && metadata.longitude) ? { lat: metadata.latitude, lng: metadata.longitude } : null
                        };
                    }
                } catch (e) {}
            }
            allPhotos.push(photoData);
        }
    }

    allPhotos.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allPhotos, null, 2));
    console.log(`✅ 处理完成！`);
}

scanPhotos();