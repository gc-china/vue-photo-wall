import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import Timeline from '../Timeline.vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import dayjs from 'dayjs';

// Mock store
vi.mock('@/store.js', () => ({
  store: {
    photos: [
      { 
        id: '1', 
        url: 'test1.jpg', 
        name: 'Photo 1', 
        date: '2023-01-01', 
        title: 'Title 1' 
      },
      { 
        id: '2', 
        url: 'test2.jpg', 
        name: 'Photo 2', 
        date: '2023-01-01', 
        title: 'Title 2' 
      },
      { 
        id: '3', 
        url: 'test3.jpg', 
        name: 'Photo 3', 
        date: '2022-12-31', 
        title: 'Title 3' 
      }
    ],
    initData: vi.fn()
  }
}));

describe('Timeline.vue', () => {
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/photo/:id', name: 'photo-detail', component: { template: '<div>Detail</div>' } }]
  });

  it('renders timeline groups correctly', async () => {
    const wrapper = mount(Timeline, {
      global: {
        plugins: [router]
      }
    });

    // Check header
    expect(wrapper.find('h2').text()).toContain('时间归档');

    // Check groups (should be 2 groups: 2023-01-01 and 2022-12-31)
    const groups = wrapper.findAll('.time-section');
    expect(groups.length).toBe(2);

    // Check date headers
    const headers = wrapper.findAll('.date-text');
    // Note: The format depends on locale, but let's check basic structure
    // 2023年01月01日 ...
    expect(headers[0].text()).toContain('2023年01月01日');
    
    // Check photo counts
    const counts = wrapper.findAll('.count');
    expect(counts[0].text()).toBe('2张');
    expect(counts[1].text()).toBe('1张');
  });

  it('navigates to detail on click', async () => {
    const pushSpy = vi.spyOn(router, 'push');
    const wrapper = mount(Timeline, {
      global: {
        plugins: [router]
      }
    });

    const photoCard = wrapper.find('.mini-card');
    await photoCard.trigger('click');

    expect(pushSpy).toHaveBeenCalledWith('/photo/1');
  });
});
