<template>
  <div class="container">
    <h1>Clear Lakes Dental - Photo Storage</h1>
    
    <!-- Upload Section -->
    <div class="upload-section">
      <h2>Upload Photo</h2>
      
      <!-- Error/Success Messages -->
      <div v-if="error" class="error">
        {{ error }}
      </div>
      <div v-if="success" class="success">
        {{ success }}
      </div>

      <!-- File Input -->
      <div class="file-input-wrapper">
        <input 
          ref="fileInput"
          type="file" 
          class="file-input"
          accept="image/*"
          @change="onFileSelected"
        />
        Choose Photo
      </div>
      
      <!-- Selected File Info -->
      <div v-if="selectedFile" class="selected-file">
        Selected: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </div>

      <!-- Upload Button -->
      <button 
        class="upload-button" 
        :disabled="!selectedFile || uploading"
        @click="handleUpload"
      >
        {{ uploading ? 'Uploading...' : 'Upload Photo' }}
      </button>
    </div>

    <!-- Photos Display -->
    <div v-if="loading" class="loading">
      Loading photos...
    </div>
    
    <div v-else-if="photos.length === 0" class="loading">
      No photos uploaded yet.
    </div>
    
    <div v-else class="photo-grid">
      <div v-for="photo in photos" :key="photo.name" class="photo-card">
        <img 
          :src="photo.publicUrl" 
          :alt="photo.name"
          class="photo-image"
          @error="onImageError"
        />
        <div class="photo-info">
          <div class="photo-name">{{ getDisplayName(photo.name) }}</div>
          <button 
            class="delete-button" 
            :disabled="deleting === photo.name"
            @click="handleDelete(photo.name)"
          >
            {{ deleting === photo.name ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { Photo } from '~/types/photo'
import { usePhotos } from '../composables/usePhotos'

const { loadPhotos, uploadPhoto, deletePhoto } = usePhotos()

// Reactive state
const photos = ref<Photo[]>([])
const loading = ref(true)
const uploading = ref(false)
const deleting = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const error = ref('')
const success = ref('')
const fileInput = ref<HTMLInputElement>()

// Load photos on mount
onMounted(async () => {
  await loadPhotosData()
})

// Load photos data
const loadPhotosData = async () => {
  try {
    loading.value = true
    error.value = ''
    photos.value = await loadPhotos()
  } catch (err: any) {
    error.value = `Failed to load photos: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Handle file selection
const onFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  clearMessages()
  
  if (file) {
    if (!file.type.startsWith('image/')) {
      error.value = 'Please select a valid image file'
      selectedFile.value = null
      return
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      error.value = 'File size must be less than 10MB'
      selectedFile.value = null
      return
    }
    
    selectedFile.value = file
  }
}

// Handle photo upload
const handleUpload = async () => {
  if (!selectedFile.value) return
  
  try {
    uploading.value = true
    clearMessages()
    
    const newPhoto = await uploadPhoto(selectedFile.value)
    photos.value.unshift(newPhoto)
    
    success.value = 'Photo uploaded successfully!'
    selectedFile.value = null
    
    // Clear file input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (err: any) {
    error.value = `Upload failed: ${err.message}`
  } finally {
    uploading.value = false
  }
}

// Handle photo deletion
const handleDelete = async (fileName: string) => {
  if (!confirm('Are you sure you want to delete this photo?')) return
  
  try {
    deleting.value = fileName
    clearMessages()
    
    await deletePhoto(fileName)
    photos.value = photos.value.filter(photo => photo.name !== fileName)
    
    success.value = 'Photo deleted successfully!'
  } catch (err: any) {
    error.value = `Delete failed: ${err.message}`
  } finally {
    deleting.value = null
  }
}

// Utility functions
const clearMessages = () => {
  error.value = ''
  success.value = ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getDisplayName = (fileName: string): string => {
  // Remove timestamp prefix if present
  return fileName.replace(/^\d+_/, '')
}

const onImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script>