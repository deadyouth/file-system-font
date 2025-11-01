// mock/file-system.ts
import { MockMethod } from 'vite-plugin-mock';
import { v4 as uuidv4 } from 'uuid';

// ====== 类型定义 ======
interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: string;
  createdAt: string; // ISO 8601
}

interface FileDTO {
  id: number;
  downloadToken: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  minioPath: string;
  parentId: number;
  isFolder: boolean;
  folderPath: string;
  createdTime: string;
  createdBy: string;
  folderName: string;
  fileCount: number;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface CreateFolderRequest {
  folderName: string;
  parentId?: number;
  createdBy?: string;
}

interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

interface ApiResponseFileDTO {
  success: boolean;
  message: string;
  data: FileDTO;
  code: number;
  timestamp: string;
}

interface ApiResponseListFileDTO {
  success: boolean;
  message: string;
  data: FileDTO[];
  code: number;
  timestamp: string;
}

interface ApiResponseVoid {
  success: boolean;
  message: string;
  data: Record<string, never>;
  code: number;
  timestamp: string;
}

interface JwtResponse {
  token: string;
}

// ====== 模拟数据 ======
let mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    password: 'password', // 注意：mock 中明文，仅用于测试
    email: 'admin@example.com',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    username: 'user1',
    password: 'password',
    email: 'user1@example.com',
    role: 'USER',
    createdAt: new Date().toISOString(),
  },
];

let mockFiles: FileDTO[] = [
  {
    id: 1,
    downloadToken: 'token_file1',
    originalName: 'report.pdf',
    fileName: 'report.pdf',
    filePath: '/1/report.pdf',
    fileSize: 204800,
    fileType: 'application/pdf',
    minioPath: 'bucket/report.pdf',
    parentId: 0,
    isFolder: false,
    folderPath: '/',
    createdTime: new Date().toISOString(),
    createdBy: 'admin',
    folderName: '',
    fileCount: 0,
  },
  {
    id: 2,
    downloadToken: '',
    originalName: 'Documents',
    fileName: 'Documents',
    filePath: '/2/',
    fileSize: 0,
    fileType: 'folder',
    minioPath: '',
    parentId: 0,
    isFolder: true,
    folderPath: '/Documents/',
    createdTime: new Date().toISOString(),
    createdBy: 'admin',
    folderName: 'Documents',
    fileCount: 1,
  },
  {
    id: 3,
    downloadToken: 'token_resume',
    originalName: 'resume.docx',
    fileName: 'resume.docx',
    filePath: '/2/resume.docx',
    fileSize: 51200,
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    minioPath: 'bucket/Documents/resume.docx',
    parentId: 2,
    isFolder: false,
    folderPath: '/Documents/',
    createdTime: new Date().toISOString(),
    createdBy: 'user1',
    folderName: '',
    fileCount: 0,
  },
];

const generateDownloadToken = () => uuidv4();

const findFileById = (id: number) => mockFiles.find(f => f.id === id);
const findFilesByParentId = (parentId: number) => mockFiles.filter(f => f.parentId === parentId);

// ====== Mock 接口 ======
const mockList: MockMethod[] = [
  // --- 用户管理 ---
  {
    url: '/api/users',
    method: 'get',
    response: () => {
      return {
        code: 200,
        data: mockUsers,
      };
    },
  },
  {
    url: '/api/users',
    method: 'post',
    response: ({ body }) => {
      const reqBody = body as Partial<User>;
      const newUser: User = {
        id: mockUsers.length + 1,
        username: reqBody.username || 'newuser',
        password: reqBody.password || 'password',
        email: reqBody.email || '',
        role: reqBody.role || 'USER',
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return {
        code: 200,
        data: newUser,
      };
    },
  },
  {
    url: '/api/users/:id',
    method: 'get',
    response: ({ params }) => {
      const id = Number(params.id);
      const user = mockUsers.find(u => u.id === id);
      if (!user) {
        return { code: 404, message: 'User not found' };
      }
      return { code: 200, data: user };
    },
  },
  {
    url: '/api/users/:id',
    method: 'put',
    response: ({ params, body }) => {
      const id = Number(params.id);
      const reqBody = body as Partial<User>;
      const index = mockUsers.findIndex(u => u.id === id);
      if (index === -1) {
        return { code: 404, message: 'User not found' };
      }
      mockUsers[index] = { ...mockUsers[index], ...reqBody };
      return { code: 200, data: mockUsers[index] };
    },
  },
  {
    url: '/api/users/:id',
    method: 'delete',
    response: ({ params }) => {
      const id = Number(params.id);
      mockUsers = mockUsers.filter(u => u.id !== id);
      return { code: 200, data: null };
    },
  },
  {
    url: '/api/users/:id/change-password',
    method: 'post',
    response: ({ body }) => {
      const _ = body as ChangePasswordRequest; // 仅用于类型检查
      return { code: 200, data: null };
    },
  },

  // --- 文件管理 ---
  {
    url: '/api/files/directory/:parentId',
    method: 'get',
    response: ({ params }) => {
      const parentId = Number(params?.parentId??0);
      const files = findFilesByParentId(parentId);
      const res: ApiResponseListFileDTO = {
        success: true,
        message: 'OK',
        data: files,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/:fileId',
    method: 'get',
    response: ({ params }) => {
      const fileId = Number(params.fileId);
      const file = findFileById(fileId);
      if (!file) {
        return { code: 404, message: 'File not found' };
      }
      const res: ApiResponseFileDTO = {
        success: true,
        message: 'OK',
        data: file,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/folder',
    method: 'post',
    response: ({ body }) => {
      const req = body as CreateFolderRequest;
      const newFolder: FileDTO = {
        id: mockFiles.length + 1,
        downloadToken: '',
        originalName: req.folderName,
        fileName: req.folderName,
        filePath: `/${mockFiles.length + 1}/`,
        fileSize: 0,
        fileType: 'folder',
        minioPath: '',
        parentId: req.parentId ?? 0,
        isFolder: true,
        folderPath: req.parentId === 0 ? `/${req.folderName}/` : `/.../${req.folderName}/`,
        createdTime: new Date().toISOString(),
        createdBy: req.createdBy ?? 'system',
        folderName: req.folderName,
        fileCount: 0,
      };
      mockFiles.push(newFolder);
      const res: ApiResponseFileDTO = {
        success: true,
        message: 'Folder created',
        data: newFolder,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/upload',
    method: 'post',
    response: ({ query }) => {
      const parentId = query.parentId ? Number(query.parentId) : 0;
      const createdBy = query.createdBy?.toString() || 'system';

      const newFile: FileDTO = {
        id: mockFiles.length + 1,
        downloadToken: generateDownloadToken(),
        originalName: 'mock_file.txt',
        fileName: 'mock_file.txt',
        filePath: `/${mockFiles.length + 1}/mock_file.txt`,
        fileSize: 1024,
        fileType: 'text/plain',
        minioPath: `bucket/${mockFiles.length + 1}/mock_file.txt`,
        parentId,
        isFolder: false,
        folderPath: parentId === 0 ? '/' : '/.../',
        createdTime: new Date().toISOString(),
        createdBy,
        folderName: '',
        fileCount: 0,
      };
      mockFiles.push(newFile);
      const res: ApiResponseFileDTO = {
        success: true,
        message: 'File uploaded',
        data: newFile,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/:fileId/rename',
    method: 'put',
    response: ({ params, query }) => {
      const fileId = Number(params.fileId);
      const newName = query.newName?.toString();
      if (!newName) {
        return { code: 400, message: 'newName is required' };
      }

      const file = findFileById(fileId);
      if (!file) {
        return { code: 404, message: 'File not found' };
      }

      file.originalName = newName;
      file.fileName = newName;
      if (file.isFolder) {
        file.folderName = newName;
      }

      const res: ApiResponseFileDTO = {
        success: true,
        message: 'Renamed',
        data: file,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/:fileId/move',
    method: 'put',
    response: ({ params, query }) => {
      const fileId = Number(params.fileId);
      const newParentId = Number(query.newParentId);
      const file = findFileById(fileId);
      if (!file) {
        return { code: 404, message: 'File not found' };
      }

      file.parentId = newParentId;
      file.folderPath = `/moved/`; // 简化处理

      const res: ApiResponseFileDTO = {
        success: true,
        message: 'Moved',
        data: file,
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/:fileId',
    method: 'delete',
    response: ({ params }) => {
      const fileId = Number(params.fileId);
      mockFiles = mockFiles.filter(f => f.id !== fileId);
      const res: ApiResponseVoid = {
        success: true,
        message: 'Deleted',
        data: {},
        code: 200,
        timestamp: new Date().toISOString(),
      };
      return res;
    },
  },
  {
    url: '/api/files/download/:downloadToken',
    method: 'get',
    rawResponse: async (req, res) => {
      const token = req.params.downloadToken as string;
      const file = mockFiles.find(f => f.downloadToken === token);
      if (!file) {
        res.statusCode = 404;
        res.end('File not found');
        return;
      }
      res.setHeader('Content-Type', file.fileType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
      res.end(`Mock content of ${file.fileName}`);
    },
  },

  // --- 认证 ---
  {
    url: '/api/auth/login',
    method: 'post',
    response: ({ body }) => {
      const { username, password } = body as LoginRequest;
      const user = mockUsers.find(u => u.username === username && u.password === password);
      if (!user) {
        return { code: 401, message: 'Invalid credentials' };
      }
      const token = 'mock-jwt-token.' + btoa(JSON.stringify({ sub: user.id, username: user.username }));
      const res: JwtResponse = { token };
      return { code: 200, data: res };
    },
  },
];

export default mockList;