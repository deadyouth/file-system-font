import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, File, Upload, Grid3X3, List, MoreHorizontal, 
  Download, Trash2, Edit3, FolderPlus, FileImage, FileVideo, 
  FileAudio, FileText as FileTextIcon, LogOut
} from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { useAuthStore } from '@/store/authStore';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

interface UploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  errorMessage?: string;
}

const FileManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  // const [isUploading, setIsUploading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploadingQueue, setIsUploadingQueue] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    fileList, 
    currentPath, 
    setCurrentPath, 
    loadDirectory, 
    createFolder, 
    // uploadFile, 
    deleteFile, 
    renameFile,
    getParentPath,
    uploadFileWithProgress,
    downloadFile
  } = useFileStore();

  useEffect(() => {
    const initializeFiles = async () => {
      await loadDirectory(0);
      setCurrentPath(0);
    };
    initializeFiles();
  }, [loadDirectory, setCurrentPath]);

  // 处理文件夹点击
  const handleFolderClick = async (folder: FileItem) => {
    setCurrentPath(folder.id);
    await loadDirectory(folder.id);
  };

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await createFolder(newFolderName, currentPath);
      
      if (!response.success) {
        toast.error(response.message || "创建文件夹失败", {
          duration: 3000
        });
        return;
      }
      
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast.success("创建文件夹成功", {
        duration: 3000
      });
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error("系统错误，请稍后重试", {
        duration: 3000
      });
    }
  };
  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newQueue: UploadItem[] = Array.from(files).map((file) => ({
      file,
      id: Math.random().toString(36).substring(2, 10),
      status: 'pending',
      progress: 0,
    }));

    setUploadQueue((prev) => [...prev, ...newQueue]);
    setIsUploadDialogOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startUpload = async () => {
  if (isUploadingQueue) return;
  setIsUploadingQueue(true);

  const pendingFiles = uploadQueue.filter((item) => item.status === 'pending');
  let successCount = 0;
  let errorCount = 0;

  for (const item of pendingFiles) {
    setUploadQueue((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q))
    );

    try {
      await uploadFileWithProgress(
        item.file,
        currentPath,
        (progress) => {
          setUploadQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, progress } : q))
          );
        }
      );
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'success', progress: 100 } : q))
      );
      successCount++;
      console.log('Upload success:', item.file.name);
    } catch (error: any) {
      console.log('Upload error:', error);
      const errorMessage = error.message || '上传失败';
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'error', errorMessage }
            : q
        )
      );
      errorCount++;
    }
  }

  setIsUploadingQueue(false);
    // 根据结果提示不同消息
  if (errorCount === 0) {
    toast.success("所有文件上传成功");
  } else if (successCount === 0) {
    toast.error("所有文件上传失败");
  } else {
    toast.warning(`部分文件上传成功：${successCount} 成功，${errorCount} 失败`);
  }
  };
  // 上传文件
  // const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = event.target.files;
  //   if (!files || files.length === 0) return;

  //   const file = files[0];
  //   setIsUploading(true);
    
  //   try {
  //     const response = await uploadFile(file, currentPath);
  //     if (!response.success) {
  //       toast.error(response.message || "上传失败");
  //       return;
  //     }
  //     toast.success("文件上传成功");
  //   } catch {
  //     toast.error("系统错误，请稍后重试");
  //   } finally {
  //     setIsUploading(false);
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = '';
  //     }
  //   }
  // };

  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);

  // 删除文件/文件夹
  const handleDelete = async (file: FileItem) => {
    setFileToDelete(file);
  };

  const confirmDelete = async () => {
    if (!fileToDelete) return;
    
    try {
      const response = await deleteFile(fileToDelete.id);
      if (!response.success) {
        toast.error(response.message || "删除失败");
        return;
      }
      toast.success("删除成功");
    } catch {
      toast.error("系统错误，请稍后重试");
    } finally {
      setFileToDelete(null);
    }
  };

  // 开始重命名
  const startRename = (file: FileItem) => {
    setSelectedFile(file);
    setRenameValue(file.fileName);
    setIsRenaming(true);
  };

  // 确认重命名
  const confirmRename = async () => {
    if (!selectedFile || !renameValue.trim()) return;

    try {
      const response = await renameFile(selectedFile.id, renameValue);
      if (!response.success) {
        toast.error(response.message || "重命名失败");
        return;
      }
      setIsRenaming(false);
      setSelectedFile(null);
      setRenameValue('');
      toast.success("重命名成功");
    } catch {
      toast.error("系统错误，请稍后重试");
    }
  };

  // 下载文件
// 替换原来的 handleDownload
const handleDownload = async (file: FileItem) => {
  if (file.isFolder) return;

  try {
    const res = await downloadFile(file.downloadToken, file.originalName || file.fileName || 'download');
    if (!res.success) {
      toast.error(res.message || '下载失败');
    }
    // 成功时，fetchBlobAndTriggerDownload 会自动触发下载，无需额外操作
  } catch (err: unknown) {
    console.error('Download error:', err);
    const message = err instanceof Error ? err.message : '下载失败';
    toast.error(message);
  }
};

  // 过滤文件列表
  const filteredFileList = fileList.filter(file =>
    file.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 获取文件图标
  const getFileIcon = (fileType: string, isFolder: boolean) => {
    if (isFolder) return <Folder className="w-8 h-8 text-blue-500" />;
    
    switch (fileType) {
      case 'image':
        return <FileImage className="w-8 h-8 text-green-500" />;
      case 'video':
        return <FileVideo className="w-8 h-8 text-purple-500" />;
      case 'audio':
        return <FileAudio className="w-8 h-8 text-orange-500" />;
      case 'pdf':
        return <FileTextIcon className="w-8 h-8 text-red-500" />;
      case 'document':
        return <FileTextIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size === 0) return '0 B';
    const i = Math.floor(Math.log(size) / Math.log(1024));
    return Math.round(size / Math.pow(1024, i) * 100) / 100 + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  // 获取面包屑路径（来自 store）
  const breadcrumbPath = getParentPath();

  const renderStatusText = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return '等待中';
      case 'uploading':
        return '上传中...';
      case 'success':
        return '完成';
      case 'error':
        return '失败';
      default:
        return '';
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center">
          <Breadcrumb>
            <BreadcrumbList className="text-md">
              {breadcrumbPath.map((item, index) => {
                const isLast = index === breadcrumbPath.length - 1;
                const displayName =
                  item.id === 0 ? "根目录" : item.fileName;

                return (
                  <React.Fragment key={item.id}>
                    {index > 0 && (
                      <BreadcrumbSeparator className="text-muted-foreground" />
                    )}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="font-medium text-foreground">
                          {displayName}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          className="font-normal text-muted-foreground hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => {
                            setCurrentPath(item.id);
                            loadDirectory(item.id);
                          }}
                        >
                          {displayName}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center space-x-2">
          {/* 搜索框 */}
          {/* <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div> */}

          {/* 视图切换 */}
          <div className="flex border rounded-md p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="p-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* 操作按钮 */}
          <Dialog open={isCreatingFolder} onOpenChange={setIsCreatingFolder}>
            <DialogTrigger asChild>
              <Button variant="default">
                <FolderPlus className="w-4 h-4 mr-2" />
                新建文件夹
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新文件夹</DialogTitle>
              </DialogHeader>
              <Input
                placeholder="文件夹名称"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
              />
              <DialogFooter>
                <Button onClick={() => setIsCreatingFolder(false)}>取消</Button>
                <Button onClick={handleCreateFolder}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="default" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            上传文件
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleSelectFiles}
            multiple
          />
          
          {/* 退出登录按钮 */}
          <Button 
            variant="outline" 
            onClick={() => {
              useAuthStore.getState().logout();
              toast.success('已退出登录');
            }}
            className="ml-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
    </div>

      {/* 文件列表 */}
      <div className="flex-1 p-4 overflow-auto">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFileList.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() =>
                  file.isFolder ? handleFolderClick(file) : handleDownload(file)
                }
              >
                <div className="flex flex-col items-center text-center">
                  {getFileIcon(file.fileType, file.isFolder)}
                  <div className="mt-2 w-full">
                    <p className="font-medium text-sm truncate w-full">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.isFolder
                        ? `${file.fileCount || 0} 项`
                        : formatFileSize(file.fileSize)}
                    </p>
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(file);
                          }}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          disabled={file.isFolder}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          下载
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(file);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">名称</th>
                  <th className="text-left p-3">类型</th>
                  <th className="text-left p-3">大小</th>
                  <th className="text-left p-3">修改时间</th>
                  <th className="text-left p-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredFileList.map((file) => (
                  <tr key={file.id} className="border-t hover:bg-gray-50">
                    <td className="p-3">
                      <div
                        className={`flex items-center ${
                          file.isFolder
                            ? "cursor-pointer hover:text-blue-600"
                            : ""
                        }`}
                        onClick={(e) => {
                          if (file.isFolder) {
                            e.stopPropagation(); // 防止触发行点击（如果后面加了行点击）
                            handleFolderClick(file);
                          }
                        }}
                      >
                        {getFileIcon(file.fileType, file.isFolder)}
                        <span className="ml-2">{file.fileName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {file.isFolder ? "文件夹" : file.fileType}
                    </td>
                    <td className="p-3">
                      {file.isFolder
                        ? `${file.fileCount || 0} 项`
                        : formatFileSize(file.fileSize)}
                    </td>
                    <td className="p-3">
                      {new Date(file.createdTime).toLocaleString()}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startRename(file)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file)}
                          disabled={file.isFolder}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(file)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredFileList.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Folder className="w-16 h-16 mb-4" />
            <p>暂无文件</p>
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {fileToDelete &&
                `确定要删除 "${fileToDelete.fileName}" 吗？此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重命名对话框 */}
      <AlertDialog open={isRenaming} onOpenChange={setIsRenaming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重命名</AlertDialogTitle>
            <AlertDialogDescription>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                autoFocus
                className="mt-2"
                placeholder="请输入新名称"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsRenaming(false);
                setSelectedFile(null);
                setRenameValue("");
              }}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRename}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      {/* 上传弹窗 */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>上传文件</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {uploadQueue.length === 0 ? (
              <p className="text-center text-gray-500">请选择文件开始上传</p>
            ) : (
              <div className="space-y-3">
                {uploadQueue.map((item) => (
                  <div key={item.id} className="border rounded-md p-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-xs">{item.file.name}</span>
                      <span className="text-gray-500">{renderStatusText(item.status)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    {item.status === 'error' && (
                      <p className="text-red-500 text-xs mt-1">{item.errorMessage}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              关闭
            </Button>
            <Button
              onClick={startUpload}
              disabled={uploadQueue.every((item) => item.status !== 'pending') || isUploadingQueue}
            >
              开始上传
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileManager;