import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';

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
  
  // Actions
  setCurrentPath: (path: number) => void;
  loadDirectory: (parentId: number) => Promise<void>;
  createFolder: (folderName: string, parentId: number) => Promise<void>;
  uploadFile: (file: File, parentId: number) => Promise<void>;
  deleteFile: (fileId: number) => Promise<void>;
  renameFile: (fileId: number, newName: string) => Promise<void>;
  moveFile: (fileId: number, newParentId: number) => Promise<void>;
}

export const useFileStore = create<FileStore>()(
  devtools(
    (set, get) => ({
      fileList: [],
      currentPath: 0,
      loading: false,
      error: null,
      
      setCurrentPath: (path) => set({ currentPath: path }),
      
      loadDirectory: async (parentId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get(`/api/files/directory/${parentId}`);
          const data = response.data;
          if (data.success) {
            set({ fileList: data.data || [], loading: false });
          } else {
            set({ error: data.message || '加载目录失败', loading: false });
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '加载目录失败', 
            loading: false 
          });
        }
      },
      
      createFolder: async (folderName, parentId) => {
        set({ loading: true, error: null });
        try {
          // Send JSON body so vite-plugin-mock receives a parsed object in `body`
          const response = await axios.post('/api/files/folder', { folderName, parentId });
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          } else {
            throw new Error(data.message || '创建文件夹失败');
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '创建文件夹失败', 
            loading: false 
          });
          throw error;
        }
      },
      
      uploadFile: async (file, parentId) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('parentId', parentId.toString());
          const response = await axios.post('/api/files/upload', formData);
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          } else {
            throw new Error(data.message || '上传文件失败');
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '上传文件失败', 
            loading: false 
          });
          throw error;
        }
      },
      
      deleteFile: async (fileId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete(`/api/files/${fileId}`);
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          } else {
            throw new Error(data.message || '删除文件失败');
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '删除文件失败', 
            loading: false 
          });
          throw error;
        }
      },
      
      renameFile: async (fileId, newName) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({ newName });
          const response = await axios.put(`/api/files/${fileId}/rename`, params);
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          } else {
            throw new Error(data.message || '重命名失败');
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '重命名失败', 
            loading: false 
          });
          throw error;
        }
      },
      
      moveFile: async (fileId, newParentId) => {
        set({ loading: true, error: null });
        try {
          const params = new URLSearchParams({ newParentId: newParentId.toString() });
          const response = await axios.put(`/api/files/${fileId}/move`, params);
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          } else {
            throw new Error(data.message || '移动文件失败');
          }
        } catch (error: any) {
          set({ 
            error: error?.message || '移动文件失败', 
            loading: false 
          });
          throw error;
        }
      },
    }),
    { name: 'fileStore' }
  )
);