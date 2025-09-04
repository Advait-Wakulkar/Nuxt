import type { Photo } from '~/types/photo'

export const usePhotos = () => {
  const { $supabase } = useNuxtApp()
  const BUCKET_NAME = 'photos'

  // Load all photos from bucket
  const loadPhotos = async (): Promise<Photo[]> => {
    try {
      const { data, error } = await $supabase.storage
        .from(BUCKET_NAME)
        .list('', { sortBy: { column: 'created_at', order: 'desc' } })

      if (error) throw error

      const photos: Photo[] = []
      
      for (const file of data || []) {
        const { data: urlData } = $supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name)
        
        photos.push({
          name: file.name,
          publicUrl: urlData.publicUrl,
          size: file.metadata?.size,
          lastModified: file.updated_at || file.created_at
        })
      }

      return photos
    } catch (error) {
      console.error('Error loading photos:', error)
      throw error
    }
  }

  // Upload a photo to bucket
  const uploadPhoto = async (file: File): Promise<Photo> => {
    try {
      const fileName = `${Date.now()}_${file.name}`
      
      const { data, error } = await $supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = $supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName)

      return {
        name: fileName,
        publicUrl: urlData.publicUrl,
        size: file.size
      }
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    }
  }

  // Delete a photo from bucket
  const deletePhoto = async (fileName: string): Promise<void> => {
    try {
      const { error } = await $supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting photo:', error)
      throw error
    }
  }

  return {
    loadPhotos,
    uploadPhoto,
    deletePhoto
  }
}