import React from 'react';
import { useFileStore } from '@/store/fileStore';

interface BreadcrumbItem {
  id: number;
  name: string;
}

interface BreadcrumbProps {
  currentPath: number;
  onNavigate: (id: number) => void;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ currentPath, onNavigate }) => {
  const getParentPath = useFileStore(state => state.getParentPath);
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([
    { id: 0, name: '根目录' }
  ]);

  React.useEffect(() => {
    // 使用新的路径栈机制获取完整路径
    const pathItems = getParentPath();
    const items = pathItems.map(item => ({
      id: item.id,
      name: item.id === 0 ? '根目录' : item.originalName
    }));
    
    setBreadcrumbs(items);
  }, [currentPath, getParentPath]);

  return (
    <nav aria-label="breadcrumb" className="flex items-center">
      {breadcrumbs.map((item, idx) => (
        <React.Fragment key={item.id}>
          {idx > 0 && <span className="mx-2 text-gray-400">/</span>}
          <button
            className={`hover:text-blue-600 transition-colors ${idx === breadcrumbs.length - 1 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};
