const assetBase = import.meta.env.BASE_URL || './'

/**
 * photos.json 保留扫描器现有的根路径格式；运行时统一转成 Vite 部署基路径，
 * 这样站点部署在仓库子目录时也不会错误请求域名根目录。
 */
export function resolvePhotoAsset(path) {
  if (!path || /^(?:https?:|blob:|data:)/i.test(path)) return path || ''
  const normalizedBase = assetBase.endsWith('/') ? assetBase : `${assetBase}/`
  return `${normalizedBase}${String(path).replace(/^\.?\//, '')}`
}

export function getThumbnailSource(photo) {
  return resolvePhotoAsset(photo?.thumbnailWebp || photo?.thumbnail || photo?.image)
}

export function getMediumSource(photo) {
  return resolvePhotoAsset(
    photo?.mediumWebp || photo?.medium || photo?.thumbnailWebp || photo?.thumbnail || photo?.image
  )
}

export function getOriginalSource(photo) {
  return resolvePhotoAsset(photo?.image)
}

export function getResponsiveSourceSet(photo) {
  const thumb = photo?.thumbnailWebp || photo?.thumbnail
  const medium = photo?.mediumWebp || photo?.medium
  if (!thumb || !medium) return ''
  return `${resolvePhotoAsset(thumb)} 400w, ${resolvePhotoAsset(medium)} 800w`
}
