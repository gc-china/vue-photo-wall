import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const photos = JSON.parse(
  fs.readFileSync(path.join(root, 'src', 'assets', 'photos.json'), 'utf8')
)
const errors = []
const ids = new Set()
const requiredAssets = ['image', 'thumbnail', 'thumbnailWebp', 'medium', 'mediumWebp']

photos.forEach((photo, index) => {
  if (!photo.id || ids.has(photo.id)) errors.push(`第 ${index + 1} 项 ID 缺失或重复: ${photo.id || '(empty)'}`)
  ids.add(photo.id)

  requiredAssets.forEach((field) => {
    const value = photo[field]
    if (!value || value.startsWith('data:')) {
      errors.push(`${photo.id}: ${field} 缺失或错误地使用 Base64`)
      return
    }
    const localPath = path.join(root, 'public', decodeURIComponent(value.replace(/^\/+/, '')))
    if (!fs.existsSync(localPath)) errors.push(`${photo.id}: ${field} 文件不存在 (${value})`)
  })

  if (!(photo.metadata?.width > 0) || !(photo.metadata?.height > 0)) {
    errors.push(`${photo.id}: 图片尺寸元数据无效`)
  }
})

if (errors.length) {
  console.error(`资源校验失败（${errors.length} 项）`)
  errors.slice(0, 30).forEach(error => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`资源校验通过：${photos.length} 张照片，${ids.size} 个唯一 ID，预览与原图引用完整`)
