<script setup>
import { ref, onMounted } from 'vue';
import dayjs from 'dayjs';

const props = defineProps({
  photo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click', 'load']);

const isLoaded = ref(false);
const imgRef = ref(null);

const handleLoad = () => {
  isLoaded.value = true;
  emit('load', props.photo.id);
};

const formatDate = (date) => dayjs(date).format('YYYY.MM.DD');

// Keyboard interaction
const handleKeydown = (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    emit('click', props.photo.id);
  }
};
</script>

<template>
  <div
    class="photo-card"
    :data-date="photo.date"
    @click="$emit('click', photo.id)"
    tabindex="0"
    role="button"
    :aria-label="`View photo: ${photo.name}`"
    @keydown="handleKeydown"
  >
    <div class="img-container" :class="{ 'loaded': isLoaded }">
      <!-- Skeleton Loading State -->
      <div v-if="!isLoaded" class="skeleton-loader"></div>
      
      <img
        ref="imgRef"
        :src="photo.thumb || photo.url"
        loading="lazy"
        :alt="photo.name || 'Photo'"
        @load="handleLoad"
      />

      <div class="overlay">
        <div class="overlay-content">
          <h3 class="photo-title">{{ photo.category }}</h3>
          <div class="exif-info" v-if="photo.exif">
            <p v-if="photo.exif.model">{{ photo.exif.model }}</p>
            <p class="date">{{ formatDate(photo.date) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.photo-card {
  position: relative;
  cursor: pointer;
  width: 100%;
  outline: none; /* Focus handled via visible focus ring on img-container or custom */
}

/* Focus State for Accessibility */
.photo-card:focus-visible .img-container {
  box-shadow: 0 0 0 3px #007bff, 0 20px 40px rgba(0, 0, 0, 0.4);
}

.img-container {
  border-radius: 12px;
  overflow: hidden;
  background: #e0e0e0;
  position: relative;
  width: 100%;
  min-height: 200px; /* Placeholder height */
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
  will-change: transform;
}

.photo-card:hover .img-container {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.img-container.loaded {
  min-height: auto;
  background: transparent;
}

.skeleton-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  z-index: 1;
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.img-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: opacity 0.5s ease;
  opacity: 0;
}

.img-container.loaded img {
  opacity: 1;
}

.img-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, transparent 50%);
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
}

.photo-card:hover .overlay,
.photo-card:focus-visible .overlay {
  opacity: 1;
}

.overlay-content {
  transform: translateY(10px);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  color: white;
}

.photo-card:hover .overlay-content,
.photo-card:focus-visible .overlay-content {
  transform: translateY(0);
}

.photo-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 4px 0;
  letter-spacing: 0.5px;
}

.exif-info {
  font-size: 0.75rem;
  opacity: 0.9;
  font-family: 'SF Mono', 'Menlo', monospace;
}
</style>
