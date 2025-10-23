import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  File, 
  Plus, 
  Upload, 
  Search, 
  Grid3X3, 
  List,
  MoreHorizontal,
  Download,
  Trash2,
  Edit3,
  FolderPlus,
  ArrowLeft,
  X,
  Image,
  Video,
  FileText,
  Music,
  FileImage,
  FileVideo,
  FileAudio,
  FileText as FileTextIcon
} from 'lucide-react';
import { useFileStore } from '@/store/fileStore';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner"

// 文件管理器组件
const FileManager: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    fileList, 
    currentPath, 
    setCurrentPath, 
    loadDirectory, 
    createFolder, 
    uploadFile, 
    deleteFile, 
    renameFile,
    moveFile
  } = useFileStore();

  useEffect(() => {
    loadDirectory(0);
    setCurrentPath(0);
  }, []);

  // 处理文件夹点击
  const handleFolderClick = (folder: any) => {
    setCurrentPath(folder.id);
  };

  // 返回上一级
  const handleGoBack = () => {
    if (currentPath === 0) return;
    // 这里需要获取当前文件夹的父级，简化处理为返回根目录
    setCurrentPath(0);
  };

  // 创建文件夹
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName, currentPath);
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast.success("创建文件夹成功");
    } catch (error) {
        toast.error("创建文件夹失败");
    }
  };

  // 上传文件
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);
    
    try {
      await uploadFile(file, currentPath);
      toast({
        title: "成功",
        description: "文件上传成功",
      });
    } catch (error) {
      toast({
        title: "错误",
        description: "上传失败",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 删除文件/文件夹
  const handleDelete = async (file: any) => {
    if (!window.confirm(`确定要删除 "${file.originalName}" 吗？`)) return;

    try {
      await deleteFile(file.id);
      toast.success("删除成功");
    } catch (error) {
        toast.error("删除失败");
    }
  };

  // 开始重命名
  const startRename = (file: any) => {
    setSelectedFile(file);
    setRenameValue(file.originalName);
    setIsRenaming(true);
  };

  // 确认重命名
  const confirmRename = async () => {
    if (!selectedFile || !renameValue.trim()) return;

    try {
      await renameFile(selectedFile.id, renameValue);
      setIsRenaming(false);
      setSelectedFile(null);
      setRenameValue('');
      toast.success("重命名成功");
    } catch (error) {
        toast.error("重命名失败");
    }
  };

  // 下载文件
  const handleDownload = (file: any) => {
    if (file.isFolder) return; // 文件夹不能下载
    window.open(`/api/files/download/${file.downloadToken}`, '_blank');
  };

  // 过滤文件列表
  const filteredFileList = fileList.filter(file =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
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
        return <FileText className="w-8 h-8 text-blue-500" />;
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

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-2">
          {currentPath !== 0 && (
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          )}
          <h1 className="text-xl font-semibold">文件管理</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="搜索文件..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
          
          {/* 视图切换 */}
          <div className="flex border rounded-md p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
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
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
              />
              <DialogFooter>
                <Button onClick={() => setIsCreatingFolder(false)}>取消</Button>
                <Button onClick={handleCreateFolder}>创建</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button
            variant="default"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? '上传中...' : '上传文件'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
          />
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 p-4 overflow-auto">
        {viewMode === 'grid' ? (
          // 网格视图
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFileList.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => file.isFolder ? handleFolderClick(file) : handleDownload(file)}
              >
                <div className="flex flex-col items-center text-center">
                  {getFileIcon(file.fileType, file.isFolder)}
                  <div className="mt-2">
                    <p className="font-medium text-sm truncate w-full">
                      {file.originalName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.isFolder 
                        ? `${file.fileCount || 0} 项` 
                        : formatFileSize(file.fileSize)
                      }
                    </p>
                  </div>
                  
                  {/* 操作菜单 */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRename(file); }}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(file); }} disabled={file.isFolder}>
                          <Download className="w-4 h-4 mr-2" />
                          下载
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="text-red-600">
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
          // 列表视图
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
                      <div className="flex items-center">
                        {getFileIcon(file.fileType, file.isFolder)}
                        <span className="ml-2">{file.originalName}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {file.isFolder ? '文件夹' : file.fileType}
                    </td>
                    <td className="p-3">
                      {file.isFolder 
                        ? `${file.fileCount || 0} 项` 
                        : formatFileSize(file.fileSize)
                      }
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

      {/* 重命名对话框 */}
      {isRenaming && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">重命名</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRenaming(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && confirmRename()}
              autoFocus
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setIsRenaming(false)}>
                取消
              </Button>
              <Button onClick={confirmRename}>
                确认
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;