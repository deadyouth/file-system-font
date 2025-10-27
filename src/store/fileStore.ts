import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;
  timestamp: string;
}

interface FileItem {
  id: number;
  downloadToken: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  minioPath: string | null;
  parentId: number;
  isFolder: boolean;
  folderPath: string;
  createdTime: string;
  createdBy: string;
  folderName: string | null;
  fileCount: number | null;
}

interface FileStore {
  fileList: FileItem[];
  currentPath: number;
  loading: boolean;
  error: string | null;
  pathHistory: { [key: number]: FileItem[] };
  pathStack: number[];  // 路径栈，存储访问路径的ID
  
  // Actions
  setCurrentPath: (path: number) => void;
  loadDirectory: (parentId: number) => Promise<ApiResponse<FileItem[]>>;
  createFolder: (folderName: string, parentId: number) => Promise<ApiResponse<null>>;
  uploadFile: (file: File, parentId: number) => Promise<ApiResponse<null>>;
  deleteFile: (fileId: number) => Promise<ApiResponse<null>>;
  renameFile: (fileId: number, newName: string) => Promise<ApiResponse<null>>;
  moveFile: (fileId: number, newParentId: number) => Promise<ApiResponse<null>>;
  getParentPath: () => FileItem[];  // 修改为直接返回当前路径栈对应的文件项数组
  navigateToPath: (targetId: number) => Promise<void>;  // 新增：导航到指定路径
}

export const useFileStore = create<FileStore>()(
  devtools(
    (set, get) => ({
      fileList: [],
      currentPath: 0,
      loading: false,
      error: null,
      pathHistory: { 0: [] },
      pathStack: [0], // 初始化为根目录ID
      
      setCurrentPath: (path) => {
        const state = get();
        const stackIndex = state.pathStack.indexOf(path);
        
        if (stackIndex !== -1) {
          // 如果是已经在栈中的路径，就回退到那个位置
          set({ 
            currentPath: path,
            pathStack: state.pathStack.slice(0, stackIndex + 1)
          });
        } else {
          // 如果是新路径，检查是否是当前路径的子目录
          const currentFile = state.fileList.find(f => f.id === path);
          if (currentFile && currentFile.parentId === state.currentPath) {
            // 是当前路径的子目录，入栈
            set(state => ({ 
              currentPath: path,
              pathStack: [...state.pathStack, path]
            }));
          } else {
            // 不是子目录，重置为只包含这个路径
            set({ 
              currentPath: path,
              pathStack: [0, path]
            });
          }
        }
      },
      
      loadDirectory: async (parentId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`/api/files/directory/${parentId}`);
          const data = response.data as ApiResponse<FileItem[]>;
          if (data.success) {
            const newFiles = data.data || [];
            set(state => ({
              fileList: newFiles,
              loading: false,
              pathHistory: {
                ...state.pathHistory,
                [parentId]: newFiles
              }
            }));
          } else {
            set({ error: data.message || '加载目录失败', loading: false });
          }
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '加载目录失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },

      getParentPath: (): FileItem[] => {
        const state = get();
        const path: FileItem[] = [];
        
        // 遍历路径栈获取每个ID对应的文件项
        for (const id of state.pathStack) {
          if (id === 0) {
            path.push({
              id: 0,
              originalName: '根目录',
              parentId: 0,
              isFolder: true,
            } as FileItem);
            continue;
          }

          // 从历史记录中查找文件项
          for (const items of Object.values(state.pathHistory)) {
            const item = items.find(item => item.id === id);
            if (item) {
              path.push(item);
              break;
            }
          }
        }
        
        return path;
      },

      navigateToPath: async (targetId: number) => {
        const { loadDirectory, setCurrentPath } = get();
        await loadDirectory(targetId);
        setCurrentPath(targetId);
      },
      
      createFolder: async (folderName, parentId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.post('/api/files/folder', { folderName, parentId });
          const data = response.data as ApiResponse<null>;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '创建文件夹失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      uploadFile: async (file, parentId) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('parentId', parentId.toString());
          const response = await axios.post('/api/files/upload', formData);
          const data = response.data as ApiResponse<null>;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '上传文件失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      deleteFile: async (fileId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete(`/api/files/${fileId}`);
          const data = response.data as ApiResponse<null>;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '删除文件失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      renameFile: async (fileId, newName) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({ newName });
          const response = await axios.put(`/api/files/${fileId}/rename`, params);
          const data = response.data as ApiResponse<null>;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '重命名失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },
      
      moveFile: async (fileId, newParentId) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({ newParentId: newParentId.toString() });
          const response = await axios.put(`/api/files/${fileId}/move`, params);
          const data = response.data as ApiResponse<null>;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '移动文件失败';
          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: 500,
            timestamp: new Date().toISOString()
          };
        }
      },
    }),
    { name: 'fileStore' }
  )
);