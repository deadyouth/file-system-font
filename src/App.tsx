import FileManager from './components/FileManage'

function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold text-center mb-8">文件上传</h1>
        <FileManager />
      </div>
    </div>
  )
}

export default App
