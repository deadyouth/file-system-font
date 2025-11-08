// src/store/fileStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import { useAuthStore } from './authStore';
import { fetchBlobAndTriggerDownload } from '@/lib/download';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  code: number;
  timestamp: string;
}

export interface FileItem {
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
  pathStack: number[];

  setCurrentPath: (path: number) => void;
  loadDirectory: (parentId: number) => Promise<ApiResponse<FileItem[]>>;
  createFolder: (folderName: string, parentId: number) => Promise<ApiResponse<null>>;
  uploadFile: (file: File, parentId: number) => Promise<ApiResponse<null>>;
  uploadFileWithProgress: (
    file: File,
    parentId: number,
    onProgress: (progress: number) => void
  ) => Promise<ApiResponse<null>>;
  downloadFile: (downloadToken: string, fallbackFilename?: string) => Promise<ApiResponse<null>>;
  deleteFile: (fileId: number) => Promise<ApiResponse<null>>;
  renameFile: (fileId: number, newName: string) => Promise<ApiResponse<null>>;
  moveFile: (fileId: number, newParentId: number) => Promise<ApiResponse<null>>;
  getParentPath: () => FileItem[];
  navigateToPath: (targetId: number) => Promise<void>;
}

export const useFileStore = create<FileStore>()(
  devtools(
    (set, get) => ({
      fileList: [],
      currentPath: 0,
      loading: false,
      error: null,
      pathHistory: { 0: [] },
      pathStack: [0],

      setCurrentPath: (path) => {
        const state = get();
        const stackIndex = state.pathStack.indexOf(path);

        if (stackIndex !== -1) {
          set({
            currentPath: path,
            pathStack: state.pathStack.slice(0, stackIndex + 1),
          });
        } else {
          const currentFile = state.fileList.find((f) => f.id === path);
          if (currentFile && currentFile.parentId === state.currentPath) {
            set((state) => ({
              currentPath: path,
              pathStack: [...state.pathStack, path],
            }));
          } else {
            set({
              currentPath: path,
              pathStack: [0, path],
            });
          }
        }
      },

      loadDirectory: async (parentId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.get<ApiResponse<FileItem[]>>(`/api/files/directory/${parentId}`);
          const data = response.data;
          if (data.success) {
            const newFiles = data.data || [];
            set((state) => ({
              fileList: newFiles,
              loading: false,
              pathHistory: {
                ...state.pathHistory,
                [parentId]: newFiles,
              },
            }));
          } else {
            set({ error: data.message || '加载目录失败', loading: false });
          }
          return data;
        } catch (error) {
          let errorMsg = '加载目录失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '加载目录失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

      getParentPath: (): FileItem[] => {
        const state = get();
        const path: FileItem[] = [];

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

          for (const items of Object.values(state.pathHistory)) {
            const item = items.find((item) => item.id === id);
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
          const response = await axios.post<ApiResponse<null>>('/api/files/folder', {
            folderName,
            parentId,
          });
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          let errorMsg = '创建文件夹失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '创建文件夹失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

      uploadFile: async (file, parentId) => {
        set({ loading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('parentId', parentId.toString());

          const response = await axios.post<ApiResponse<null>>('/api/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          let errorMsg = '上传文件失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '上传文件失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

uploadFileWithProgress: async (file, parentId, onProgress) => {
  return new Promise<ApiResponse<null>>((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parentId', parentId.toString());

    const xhr = new XMLHttpRequest();
    const {token} = useAuthStore.getState();
    xhr.upload.onprogress = (event: ProgressEvent) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as ApiResponse<null>;
        if (data.success) {
          // 注意：这里不要 await，因为 resolve 是同步的
          // loadDirectory 可以在 resolve 后由调用方处理，或用 get() 异步调用
          const { currentPath, loadDirectory } = get();
          loadDirectory(currentPath); // 不需要 await，避免阻塞 resolve
          resolve(data);
        } else {
          reject(new Error(data.message || '上传失败'));
        }
      } catch {
        reject(new Error('响应解析失败'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('网络错误'));
    };

    xhr.open('POST', '/api/files/upload');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
  });
  // ✅ 移除 .then(...) 的错误兜底！让 reject 透传出去
},

      deleteFile: async (fileId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.delete<ApiResponse<null>>(`/api/files/${fileId}`);
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          let errorMsg = '删除文件失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '删除文件失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

      renameFile: async (fileId, newName) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.put<ApiResponse<null>>(
            `/api/files/${fileId}/rename`,
            undefined,
            {
              params: { newName },
            }
          );
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          let errorMsg = '重命名失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '重命名失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

      moveFile: async (fileId, newParentId) => {
        set({ loading: true, error: null });
        try {
          const response = await axios.put<ApiResponse<null>>(
            `/api/files/${fileId}/move`,
            undefined,
            {
              params: { newParentId },
            }
          );
          const data = response.data;
          if (data.success) {
            const { currentPath, loadDirectory } = get();
            await loadDirectory(currentPath);
          }
          set({ loading: false });
          return data;
        } catch (error) {
          let errorMsg = '移动文件失败';
          let statusCode = 500;

          if (axios.isAxiosError(error)) {
            errorMsg = error.response?.data?.message || error.message || '移动文件失败';
            statusCode = error.response?.status || 500;
          }

          set({ error: errorMsg, loading: false });
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          };
        }
      },

      // Download a file by its download token. This will attempt to fetch the blob
      // and trigger a browser download via fetchBlobAndTriggerDownload. Returns
      // an ApiResponse-like result indicating success or failure.
      downloadFile: async (downloadToken, fallbackFilename = 'download') => {
        try {
          await fetchBlobAndTriggerDownload(`/api/files/download/${downloadToken}`, fallbackFilename);
          return {
            success: true,
            message: '下载开始',
            data: null,
            code: 200,
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>;
        } catch (err: unknown) {
          let errorMsg = '下载失败';
          const statusCode = 500;
          if (err instanceof Error) {
            errorMsg = err.message || errorMsg;
          }
          return {
            success: false,
            message: errorMsg,
            data: null,
            code: statusCode,
            timestamp: new Date().toISOString(),
          } as ApiResponse<null>;
        }
      },
    }),
    { name: 'fileStore' }
  )
);