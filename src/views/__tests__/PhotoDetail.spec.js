import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PhotoDetail from '../PhotoDetail.vue';
import { createRouter, createWebHashHistory } from 'vue-router';

// Mock store
vi.mock('@/store.js', () => ({
  store: {
    photos: [
      { 
        id: '1', 
        url: 'test.jpg', 
        name: 'Test Photo', 
        date: '2023-01-01',
        exif: { gps: { lat: 0, lng: 0 } }
      },
      { id: '2', url: 'test2.jpg', name: 'Test Photo 2' }
    ],
    initData: vi.fn()
  }
}));

// Mock libraries that use browser APIs not fully implemented in jsdom
vi.mock('leaflet', () => ({
  default: {
    map: () => ({
      setView: () => ({ addTo: () => {} }),
      remove: () => {},
      off: () => {}
    }),
    tileLayer: () => ({ addTo: () => {} }),
    circleMarker: () => ({ addTo: () => {} })
  }
}));

vi.mock('panzoom', () => ({
  default: () => ({
    dispose: () => {}
  })
}));

describe('PhotoDetail.vue', () => {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/photo/:id', component: PhotoDetail }]
  });

  it('renders photo details correctly', async () => {
    router.push('/photo/1');
    await router.isReady();

    const wrapper = mount(PhotoDetail, {
      global: {
        plugins: [router]
      }
    });

    expect(wrapper.find('.main-img').exists()).toBe(true);
    expect(wrapper.text()).toContain('Test Photo');
  });

  it('toggles info sidebar', async () => {
    router.push('/photo/1');
    await router.isReady();

    const wrapper = mount(PhotoDetail, {
      global: {
        plugins: [router]
      }
    });

    const toggleBtn = wrapper.find('.info-toggle');
    await toggleBtn.trigger('click');
    
    // Check if class changes (initially open=true, click -> false)
    // Note: The logic in component is isInfoOpen = !isInfoOpen. Initial is true.
    expect(wrapper.find('.sidebar').classes()).toContain('sidebar-closed');
  });
});
