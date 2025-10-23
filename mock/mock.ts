import { MockMethod } from 'vite-plugin-mock'

interface FileEntity {
  id: number
  downloadToken: string
  originalName: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  minioPath: string | null
  parentId: number
  isFolder: boolean
  folderPath: string
  createdTime: string
  createdBy: string
  folderName: string | null
  fileCount: number | null
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  code: number
  timestamp: string
}

const mockFiles: FileEntity[] = [
  // 根目录下的文件和文件夹
  {
    id: 3,
    downloadToken: "root-folder-001",
    originalName: "项目文档",
    fileName: null,
    filePath: "/项目文档",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 0,
    isFolder: true,
    folderPath: "/",
    createdTime: "2025-10-22 09:00:00",
    createdBy: "admin",
    folderName: "项目文档",
    fileCount: 8
  },
  {
    id: 4,
    downloadToken: "root-folder-002",
    originalName: "图片资源",
    fileName: null,
    filePath: "/图片资源",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 0,
    isFolder: true,
    folderPath: "/",
    createdTime: "2025-10-22 09:15:00",
    createdBy: "admin",
    folderName: "图片资源",
    fileCount: 12
  },
  {
    id: 5,
    downloadToken: "root-folder-003",
    originalName: "测试文件",
    fileName: null,
    filePath: "/测试文件",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 0,
    isFolder: true,
    folderPath: "/",
    createdTime: "2025-10-22 09:30:00",
    createdBy: "system",
    folderName: "测试文件",
    fileCount: 5
  },

  // 项目文档文件夹下的内容
  {
    id: 6,
    downloadToken: "project-doc-001",
    originalName: "需求文档",
    fileName: null,
    filePath: "/项目文档/需求文档",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 3,
    isFolder: true,
    folderPath: "/项目文档",
    createdTime: "2025-10-22 10:00:00",
    createdBy: "admin",
    folderName: "需求文档",
    fileCount: 3
  },
  {
    id: 7,
    downloadToken: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    originalName: "项目计划.pdf",
    fileName: "1761137564001_项目计划.pdf",
    filePath: "/项目文档/1761137564001_项目计划.pdf",
    fileSize: 2048000,
    fileType: "pdf",
    minioPath: "1761137564001_项目计划.pdf",
    parentId: 3,
    isFolder: false,
    folderPath: "/项目文档",
    createdTime: "2025-10-22 10:30:00",
    createdBy: "admin",
    folderName: null,
    fileCount: null
  },

  // 图片资源文件夹下的内容
  {
    id: 8,
    downloadToken: "images-folder-001",
    originalName: "产品截图",
    fileName: null,
    filePath: "/图片资源/产品截图",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 4,
    isFolder: true,
    folderPath: "/图片资源",
    createdTime: "2025-10-22 11:00:00",
    createdBy: "designer",
    folderName: "产品截图",
    fileCount: 6
  },
  {
    id: 9,
    downloadToken: "d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a",
    originalName: "logo.svg",
    fileName: "1761137564002_logo.svg",
    filePath: "/图片资源/1761137564002_logo.svg",
    fileSize: 15200,
    fileType: "image",
    minioPath: "1761137564002_logo.svg",
    parentId: 4,
    isFolder: false,
    folderPath: "/图片资源",
    createdTime: "2025-10-22 11:15:00",
    createdBy: "designer",
    folderName: null,
    fileCount: null
  },

  // 测试文件文件夹下的内容（包含您原有的文件）
  {
    id: 10,
    downloadToken: "test-folder-001",
    originalName: "test_folder",
    fileName: null,
    filePath: "/测试文件/test_folder",
    fileSize: 0,
    fileType: "folder",
    minioPath: null,
    parentId: 5,
    isFolder: true,
    folderPath: "/测试文件",
    createdTime: "2025-10-22 20:50:00",
    createdBy: "system",
    folderName: "test_folder",
    fileCount: 1
  },
  {
    id: 1,
    downloadToken: "3fc32ec1-343b-48a7-a8b7-b087445e3670",
    originalName: "test.png",
    fileName: "1761137563939_test.png",
    filePath: "/测试文件/test_folder/1761137563939_test.png",
    fileSize: 21205,
    fileType: "image",
    minioPath: "1761137563939_test.png",
    parentId: 10, // 修改为 test_folder 的ID
    isFolder: false,
    folderPath: "/测试文件/test_folder",
    createdTime: "2025-10-22 20:52:44",
    createdBy: "system",
    folderName: null,
    fileCount: null
  },

  // 其他根目录文件
  {
    id: 11,
    downloadToken: "e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b",
    originalName: "README.md",
    fileName: "1761137564003_README.md",
    filePath: "/1761137564003_README.md",
    fileSize: 4096,
    fileType: "text",
    minioPath: "1761137564003_README.md",
    parentId: 0,
    isFolder: false,
    folderPath: "/",
    createdTime: "2025-10-22 08:00:00",
    createdBy: "admin",
    folderName: null,
    fileCount: null
  },
  {
    id: 12,
    downloadToken: "f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c",
    originalName: "config.json",
    fileName: "1761137564004_config.json",
    filePath: "/1761137564004_config.json",
    fileSize: 1024,
    fileType: "json",
    minioPath: "1761137564004_config.json",
    parentId: 0,
    isFolder: false,
    folderPath: "/",
    createdTime: "2025-10-22 08:05:00",
    createdBy: "system",
    folderName: null,
    fileCount: null
  }
];

const generateResponse = <T>(data: T, message = "操作成功", success = true, code = 200): ApiResponse<T> => {
  return {
    success,
    message,
    data,
    code,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
  }
}

export default [
  {
    url: '/api/files/upload',
    method: 'post',
    response: ({ body }) => {
      const { file, parentId = 0, createdBy = "system" } = body

      const newFile: FileEntity = {
        id: mockFiles.length + 1,
        downloadToken: `token-${Date.now()}`,
        originalName: file?.name || 'mock_file.txt',
        fileName: `${Date.now()}_mock_file.txt`,
        filePath: parentId === 0 ? `/${Date.now()}_mock_file.txt` : `/folder_${parentId}/${Date.now()}_mock_file.txt`,
        fileSize: file?.size || 1024,
        fileType: file?.type || 'other',
        minioPath: `${Date.now()}_mock_file.txt`,
        parentId,
        isFolder: false,
        folderPath: parentId === 0 ? "/" : `/folder_${parentId}`,
        createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        createdBy,
        folderName: null,
        fileCount: null
      }

      mockFiles.push(newFile)
      return generateResponse(newFile, "文件上传成功")
    }
  },
  {
    url: '/api/files/folder',
    method: 'post',
    response: ({ body }) => {
      const { folderName = 'New Folder', parentId = 0, createdBy = "system" } = body

      const newFolder: FileEntity = {
        id: mockFiles.length + 5,
        downloadToken: `token-${Date.now()}`,
        originalName: folderName,
        fileName: folderName,
        filePath: parentId === 0 ? `/${folderName}` : `/folder_${parentId}/${folderName}`,
        fileSize: 0,
        fileType: "folder",
        minioPath: null,
        parentId,
        isFolder: true,
        folderPath: parentId === 0 ? "/" : `/folder_${parentId}`,
        createdTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        createdBy,
        folderName,
        fileCount: 0
      }
      mockFiles.push(newFolder)
      console.log(mockFiles)
      return generateResponse(newFolder, "文件夹创建成功")
    }
  },
  {
    url: '/api/files/directory/:id',
    method: 'get',
    response: ({ query }) => {
      const parentId = parseInt(query.id as string)
      const content = mockFiles.filter(item => item.parentId === parentId)
      console.log(mockFiles)
      return generateResponse(content, "获取目录内容成功")
    }
  },
  {
    url: '/api/files/:id',
    method: 'delete',
    response: ({ query }) => {
      const fileId = parseInt(query.id as string)
      const fileIndex = mockFiles.findIndex(item => item.id === fileId)
      
      if (fileIndex === -1) {
        return generateResponse(null, "文件不存在", false, 404)
      }
      
      if (mockFiles[fileIndex].isFolder) {
        const children = mockFiles.filter(item => item.parentId === fileId)
        children.forEach(child => {
          const childIndex = mockFiles.findIndex(item => item.id === child.id)
          if (childIndex !== -1) {
            mockFiles.splice(childIndex, 1)
          }
        })
      }
      
      mockFiles.splice(fileIndex, 1)
      return generateResponse(null, "删除成功")
    }
  },
  {
    url: '/api/files/:id/rename',
    method: 'put',
    response: ({ query, body }) => {
      const fileId = parseInt(query.id as string)
      const { newName = 'Renamed Item' } = body
      
      const fileIndex = mockFiles.findIndex(item => item.id === fileId)
      if (fileIndex === -1) {
        return generateResponse(null, "文件不存在", false, 404)
      }
      
      const oldName = mockFiles[fileIndex].originalName
      const oldPath = mockFiles[fileIndex].filePath
      
      mockFiles[fileIndex].originalName = newName
      mockFiles[fileIndex].fileName = newName
      
      if (mockFiles[fileIndex].isFolder) {
        const newPath = oldPath.replace(new RegExp(oldName + '$'), newName)
        mockFiles[fileIndex].filePath = newPath
        
        // 更新子项的路径
        mockFiles.forEach(item => {
          if (item.folderPath.startsWith(oldPath)) {
            item.folderPath = item.folderPath.replace(oldPath, newPath)
            item.filePath = item.filePath.replace(oldPath, newPath)
          }
        })
      } else {
        mockFiles[fileIndex].filePath = mockFiles[fileIndex].folderPath + "/" + newName
      }
      
      return generateResponse(mockFiles[fileIndex], "重命名成功")
    }
  },
  {
    url: '/api/files/:id/move',
    method: 'put',
    response: ({ query, body }) => {
      const fileId = parseInt(query.id as string)
      const { newParentId } = body
      
      const fileIndex = mockFiles.findIndex(item => item.id === fileId)
      if (fileIndex === -1) {
        return generateResponse(null, "文件不存在", false, 404)
      }
      
      const newParent = newParentId === 0 ? null : mockFiles.find(item => item.id === newParentId && item.isFolder)
      if (!newParent && newParentId !== 0) {
        return generateResponse(null, "目标目录不存在", false, 404)
      }
      
      mockFiles[fileIndex].parentId = newParentId
      const newFolderPath = newParentId === 0 ? "/" : newParent!.filePath
      mockFiles[fileIndex].folderPath = newFolderPath
      mockFiles[fileIndex].filePath = newFolderPath + "/" + mockFiles[fileIndex].fileName
      
      if (mockFiles[fileIndex].isFolder) {
        // 更新子项的路径
        const oldPath = mockFiles[fileIndex].filePath
        mockFiles.forEach(item => {
          if (item.folderPath.startsWith(oldPath)) {
            const relativePath = item.folderPath.slice(oldPath.length)
            item.folderPath = newFolderPath + relativePath
            item.filePath = item.folderPath + "/" + item.fileName
          }
        })
      }
      
      return generateResponse(mockFiles[fileIndex], "移动成功")
    }
  },
  {
    url: '/api/files/:id',
    method: 'get',
    response: ({ query }) => {
      const fileId = parseInt(query.id as string)
      const file = mockFiles.find(item => item.id === fileId)
      
      if (!file) {
        return generateResponse(null, "文件不存在", false, 404)
      }
      
      return generateResponse(file, "获取文件详情成功")
    }
  },
  {
    url: '/api/files/download-url/:id',
    method: 'get',
    response: ({ query }) => {
      const fileId = parseInt(query.id as string)
      const file = mockFiles.find(item => item.id === fileId)
      
      if (!file) {
        return generateResponse(null, "文件不存在", false, 404)
      }
      
      return generateResponse(`/api/files/download/${file.downloadToken}`, "获取下载链接成功")
    }
  },
  {
    url: '/api/files/download/:token',
    method: 'get',
    response: ({ query }) => {
      const token = query.token as string
      const file = mockFiles.find(item => item.downloadToken === token)
      
      if (!file) {
        return generateResponse(null, "文件不存在或访问权限不足", false, 404)
      }
      
      return {
        type: 'blob',
        data: new Blob(['mock file content'], { type: 'application/octet-stream' }),
        headers: {
          'Content-Disposition': `attachment; filename="${file.originalName}"`,
          'Content-Type': 'application/octet-stream'
        }
      }
    }
  }
] as MockMethod[]