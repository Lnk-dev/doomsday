/**
 * Profile Edit Modal
 * Issue #52: Add user profile editing
 *
 * Modal for editing user profile information.
 */

import { useState } from 'react'
import { X, Camera } from 'lucide-react'
import { useUserStore } from '@/store'

interface ProfileEditModalProps {
  onClose: () => void
}

export function ProfileEditModal({ onClose }: ProfileEditModalProps) {
  const author = useUserStore((state) => state.author)
  const displayName = useUserStore((state) => state.displayName)
  const bio = useUserStore((state) => state.bio)
  const updateProfile = useUserStore((state) => state.updateProfile)
  const setUsername = useUserStore((state) => state.setUsername)

  const [formData, setFormData] = useState({
    displayName: displayName || author.username,
    username: author.username,
    bio: bio,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores'
    }

    if (formData.bio.length > 160) {
      newErrors.bio = 'Bio must be 160 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    updateProfile({
      displayName: formData.displayName.trim() || formData.username,
      bio: formData.bio.trim(),
    })

    if (formData.username !== author.username) {
      setUsername(formData.username.toLowerCase())
    }

    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md mx-4 bg-[#1a1a1a] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#333]">
          <button onClick={onClose} className="p-1">
            <X size={24} className="text-white" />
          </button>
          <h2 className="text-[17px] font-semibold text-white">Edit profile</h2>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 bg-white text-black text-[14px] font-semibold rounded-full"
          >
            Save
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#333] flex items-center justify-center">
                {author.avatar ? (
                  <img src={author.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl text-[#777]">{formData.username[0]?.toUpperCase()}</span>
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-[#ff3040] rounded-full">
                <Camera size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-[13px] text-[#777] mb-1.5">Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your display name"
                className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#333] rounded-xl text-[15px] text-white placeholder-[#555] outline-none focus:border-[#555] transition-colors"
                maxLength={50}
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-[13px] text-[#777] mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                  placeholder="username"
                  className={`w-full pl-8 pr-4 py-3 bg-[#0a0a0a] border rounded-xl text-[15px] text-white placeholder-[#555] outline-none transition-colors ${
                    errors.username ? 'border-[#ff3040]' : 'border-[#333] focus:border-[#555]'
                  }`}
                  maxLength={30}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-[12px] text-[#ff3040]">{errors.username}</p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[13px] text-[#777] mb-1.5">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell the world about yourself"
                rows={3}
                className={`w-full px-4 py-3 bg-[#0a0a0a] border rounded-xl text-[15px] text-white placeholder-[#555] outline-none resize-none transition-colors ${
                  errors.bio ? 'border-[#ff3040]' : 'border-[#333] focus:border-[#555]'
                }`}
                maxLength={160}
              />
              <div className="flex justify-between mt-1">
                {errors.bio ? (
                  <p className="text-[12px] text-[#ff3040]">{errors.bio}</p>
                ) : (
                  <span />
                )}
                <span className={`text-[12px] ${formData.bio.length > 140 ? 'text-[#ff3040]' : 'text-[#555]'}`}>
                  {formData.bio.length}/160
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
