import { supabase } from '@/lib/supabase/client'

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  company_id: string | null
  role: 'individual' | 'manager' | 'seller'
  created_at: string
}

export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data as Profile
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    // Using upsert to handle cases where profile might be missing (edge case)
    // We need to ensure the user_id is present for upsert
    const profileData = {
      user_id: userId,
      ...updates,
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
    return data.publicUrl
  },
}
