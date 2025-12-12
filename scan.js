/* scan.js - 修复版 (统一缩略图尺寸 + 修复视频详情元数据) */
import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

// 设置 ffmpeg 和 ffprobe 路径
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

const PHOTOS_DIR = './public/photos';
const THUMBS_DIR = './public/thumbs';
const GENERATED_DIR = './public/generated';
const OUTPUT_FILE = './src/assets/photos.json';

// 确保目录存在
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

// 1. 获取视频元数据
const getVideoMeta = (filePath) => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                resolve({ width: 0, height: 0, duration: 0 });
            } else {
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                // 处理手机竖屏拍摄的旋转问题
                let width = videoStream ? videoStream.width : 0;
                let height = videoStream ? videoStream.height : 0;
                const rotation = videoStream?.tags?.rotate || videoStream?.tags?.js_rotate || 0;

                // 如果视频有 90 或 270 度旋转标记，交换宽高
                if (Math.abs(rotation - 90) < 1 || Math.abs(rotation - 270) < 1) {
                    [width, height] = [height, width];
                }

                resolve({ width, height, duration: metadata.format.duration || 0 });
            }
        });
    });
};

// 2. 视频转码
const processVideo = (filePath, album, filename) => {
    return new Promise((resolve, reject) => {
        if (filename.toLowerCase().endsWith('.mp4')) { resolve(null); return; }

        const relativeOutput = `generated/${album}/${filename.replace(/\.\w+$/, '.mp4')}`;
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

// 3. 生成视频缩略图 (重点修改：先截图到临时文件 -> 再用 Sharp 统一处理)
const generateVideoThumbnail = async (videoPath, thumbPath) => {
    // 最终目标路径
    const finalThumbPath = thumbPath.replace(/\.\w+$/, '.jpg');
    if (fs.existsSync(finalThumbPath)) return;

    const tempName = `temp_${path.basename(finalThumbPath)}`;
    const tempPath = path.join(path.dirname(finalThumbPath), tempName);
    const thumbDir = path.dirname(finalThumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

    return new Promise((resolve) => {
        // 1. FFmpeg 截取原始尺寸的高清图
        ffmpeg(videoPath)
            .screenshots({
                count: 1,
                folder: thumbDir,
                filename: tempName,
                timemarks: ['1'] // 截取第1秒，避免第0秒黑屏
            })
            .on('end', async () => {
                // 2. Sharp 处理：确保尺寸和普通图片完全一致
                try {
                    await sharp(tempPath)
                        .resize(400, null, { fit: 'inside', withoutEnlargement: true }) // 统一宽度逻辑
                        .jpeg({ quality: 80, mozjpeg: true })
                        .toFile(finalThumbPath);

                    // 删除临时文件
                    fs.unlinkSync(tempPath);
                    console.log(`📸 视频缩略图: ${path.basename(finalThumbPath)}`);
                } catch (e) {
                    console.error('Sharp 处理视频截图失败', e);
                }
                resolve();
            })
            .on('error', (err) => {
                console.error('FFmpeg 截图失败', err);
                resolve();
            });
    });
};

// 4. HEIC 转 JPG
async function processHeicImage(filePath, album, filename) {
    const relativeOutput = `generated/${album}/${filename.replace(/\.heic$/i, '.jpg')}`;
    const outputPath = path.join('./public', relativeOutput);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    if (!fs.existsSync(outputPath)) {
        try { await sharp(filePath).jpeg({ quality: 90 }).toFile(outputPath); } catch (err) { return null; }
    }
    return relativeOutput;
}

// 5. 生成图片缩略图
async function generateThumbnail(sourcePath, relativePath) {
    const thumbPath = path.join(THUMBS_DIR, relativePath.replace(/\.(heic|mov|mp4)$/i, '.jpg'));
    const thumbDir = path.dirname(thumbPath);
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
    if (fs.existsSync(thumbPath)) return;

    try {
        await sharp(sourcePath)
            .resize(400, null, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(thumbPath);
        console.log(`✨ 图片缩略图: ${path.basename(relativePath)}`);
    } catch (err) {}
}

async function scanPhotos() {
    if (!fs.existsSync(PHOTOS_DIR)) return;
    const albums = fs.readdirSync(PHOTOS_DIR).filter(item => fs.statSync(path.join(PHOTOS_DIR, item)).isDirectory());
    let allPhotos = [];

    console.log('🚀 开始扫描 (修复样式版)...');

    for (const album of albums) {
        const albumPath = path.join(PHOTOS_DIR, album);
        const files = fs.readdirSync(albumPath).filter(f => /\.(jpg|jpeg|png|webp|heic|mov|mp4)$/i.test(f));

        for (const file of files) {
            const filePath = path.join(albumPath, file);
            const stats = fs.statSync(filePath);
            const _isVideo = isVideo(file);
            const _isHeic = isHeic(file);

            let finalUrl = `photos/${album}/${file}`;
            let thumbUrl = `thumbs/${album}/${file}`.replace(/\.\w+$/, '.jpg');
            let width = 0;
            let height = 0;

            if (_isVideo) {
                // 视频处理
                const convertedVideo = await processVideo(filePath, album, file);
                if (convertedVideo) finalUrl = convertedVideo;

                // 获取真实宽高 (修复详情页样式)
                const meta = await getVideoMeta(filePath);
                width = meta.width;
                height = meta.height;

                await generateVideoThumbnail(filePath, path.join(THUMBS_DIR, `${album}/${file}`));
            } else if (_isHeic) {
                const convertedPath = await processHeicImage(filePath, album, file);
                if (convertedPath) {
                    finalUrl = convertedPath;
                    await generateThumbnail(path.join('./public', convertedPath), `${album}/${file}`);
                }
            } else {
                await generateThumbnail(filePath, `${album}/${file}`);
            }

            // 构建数据
            let photoData = {
                id: Math.random().toString(36).substr(2, 9),
                url: finalUrl,
                thumb: thumbUrl,
                name: file,
                category: album,
                date: stats.mtime,
                size: formatFileSize(stats.size),
                width: width,
                height: height,
                type: _isVideo ? 'video' : 'image',
                exif: {}
            };

            if (!_isVideo) {
                try {
                    const metadata = await exifr.parse(filePath, { tiff: true, exif: true, gps: true, mergeOutput: true });
                    if (metadata) {
                        photoData.date = metadata.DateTimeOriginal || metadata.CreateDate || stats.mtime;
                        // 如果是图片，优先用 exif 的宽高
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