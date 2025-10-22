import { create } from 'zustand'

interface FileItem {
  id: string
  name: string
  size: number
  type: string
  uploadProgress: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
}

interface FileStore {
  files: FileItem[]
  addFile: (file: File) => void
  updateFileProgress: (id: string, progress: number) => void
  updateFileStatus: (id: string, status: FileItem['status'], error?: string) => void
  removeFile: (id: string) => void
  clearFiles: () => void
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  addFile: (file: File) => {
    const newFile: FileItem = {
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadProgress: 0,
      status: 'idle',
    }
    set((state) => ({ files: [...state.files, newFile] }))
  },
  updateFileProgress: (id: string, progress: number) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, uploadProgress: progress } : file
      ),
    }))
  },
  updateFileStatus: (id: string, status: FileItem['status'], error?: string) => {
    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, status, error } : file
      ),
    }))
  },
  removeFile: (id: string) => {
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    }))
  },
  clearFiles: () => {
    set({ files: [] })
  },
}))