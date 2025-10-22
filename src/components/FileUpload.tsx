import type { ChangeEvent } from 'react'
import { useCallback, useRef } from 'react'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { useFileStore } from '../lib/store'
import { Button } from './ui/button'

export function FileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { files, addFile, removeFile, updateFileProgress, updateFileStatus } = useFileStore()

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    Array.from(selectedFiles).forEach((file) => {
      addFile(file)
      simulateFileUpload(file.size)
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 模拟文件上传过程
  const simulateFileUpload = useCallback((fileSize: number) => {
    const fileId = files[files.length - 1].id
    let progress = 0

    const uploadInterval = setInterval(() => {
      progress += 10
      updateFileProgress(fileId, progress)

      if (progress >= 100) {
        clearInterval(uploadInterval)
        updateFileStatus(fileId, 'success')
      }
    }, 500)
  }, [files, updateFileProgress, updateFileStatus])

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-sm text-gray-500 mb-4">拖拽文件到此处或点击上传</p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          选择文件
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
      </div>

      <div className="mt-6 space-y-4">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    file.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${file.uploadProgress}%` }}
                />
              </div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                {file.status === 'success' && (
                  <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500 ml-2" />
                )}
              </div>
            </div>
            <button
              onClick={() => removeFile(file.id)}
              className="ml-4 p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}