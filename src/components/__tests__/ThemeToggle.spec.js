import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from '../ThemeToggle.vue'

describe('ThemeToggle', () => {
  it('renders properly', () => {
    const wrapper = mount(ThemeToggle)
    expect(wrapper.find('.theme-toggle').exists()).toBe(true)
  })

  it('toggles theme on click', async () => {
    const wrapper = mount(ThemeToggle)
    
    // Get initial theme (might be null if onMounted hasn't run or completed, but mount triggers it)
    // Wait for next tick just in case
    await wrapper.vm.$nextTick()
    
    const initialTheme = document.documentElement.getAttribute('data-theme')
    
    await wrapper.trigger('click')
    
    const newTheme = document.documentElement.getAttribute('data-theme')
    
    expect(newTheme).not.toBe(initialTheme)
    expect(['light', 'dark']).toContain(newTheme)
  })
})
