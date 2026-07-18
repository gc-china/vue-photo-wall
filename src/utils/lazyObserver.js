const callbacks = new WeakMap()
let observer = null

function getObserver() {
  if (observer || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return observer
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const callback = callbacks.get(entry.target)
        if (callback) callback()
        callbacks.delete(entry.target)
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '240px 0px', threshold: 0.01 }
  )

  return observer
}

/**
 * 全站缩略图共享一个 IntersectionObserver，避免每张卡片都创建原生观察器。
 * @returns {() => void} 组件卸载时调用的清理函数
 */
export function observeLazyElement(element, onVisible) {
  if (!element) return () => {}

  const sharedObserver = getObserver()
  if (!sharedObserver) {
    onVisible()
    return () => {}
  }

  callbacks.set(element, onVisible)
  sharedObserver.observe(element)

  return () => {
    callbacks.delete(element)
    sharedObserver.unobserve(element)
  }
}
