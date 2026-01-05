import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoCard from '../PhotoCard.vue'

describe('PhotoCard', () => {
  const mockPhoto = {
    id: '123',
    url: 'test.jpg',
    thumb: 'thumb.jpg',
    name: 'Test Photo',
    date: '2023-01-01'
  }

  it('renders properly', () => {
    const wrapper = mount(PhotoCard, {
      props: {
        photo: mockPhoto
      }
    })
    expect(wrapper.find('.photo-card').exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBe('View photo: Test Photo')
  })

  it('shows skeleton loader initially', () => {
    const wrapper = mount(PhotoCard, {
      props: {
        photo: mockPhoto
      }
    })
    expect(wrapper.find('.skeleton-loader').exists()).toBe(true)
  })

  it('emits click event', async () => {
    const wrapper = mount(PhotoCard, {
      props: {
        photo: mockPhoto
      }
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toHaveProperty('click')
    expect(wrapper.emitted('click')[0]).toEqual(['123'])
  })
})
