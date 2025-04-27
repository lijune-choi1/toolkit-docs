import React, { useState } from 'react';
import { FolderIcon, FileIcon, FileTextIcon, ImageIcon, UploadIcon, FolderPlusIcon, TrashIcon, DownloadIcon, MenuIcon } from 'lucide-react';

// Main application component
const DropboxApp = () => {
  // State for file system
  const [fileSystem, setFileSystem] = useState({
    name: 'My Dropbox',
    type: 'folder',
    path: '/',
    children: [
      {
        name: 'Documents',
        type: 'folder',
        path: '/Documents',
        children: [
          { name: 'Work Report.docx', type: 'doc', path: '/Documents/Work Report.docx', size: '2.4 MB', lastModified: '2025-04-12' },
          { name: 'Presentation.pptx', type: 'ppt', path: '/Documents/Presentation.pptx', size: '5.7 MB', lastModified: '2025-04-10' }
        ]
      },
      {
        name: 'Images',
        type: 'folder',
        path: '/Images',
        children: [
          { name: 'Vacation.jpg', type: 'image', path: '/Images/Vacation.jpg', size: '3.2 MB', lastModified: '2025-04-08' },
          { name: 'Profile.png', type: 'image', path: '/Images/Profile.png', size: '1.5 MB', lastModified: '2025-04-05' }
        ]
      },
      { name: 'Notes.txt', type: 'text', path: '/Notes.txt', size: '12 KB', lastModified: '2025-04-14' },
      { name: 'Budget.xlsx', type: 'xls', path: '/Budget.xlsx', size: '1.8 MB', lastModified: '2025-04-13' }
    ]
  });

  // State for current path and navigation
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Get current folder based on path
  const getCurrentFolder = () => {
    if (currentPath === '/') return fileSystem;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    let currentFolder = fileSystem;
    
    for (const segment of pathSegments) {
      const nextFolder = currentFolder.children.find(item => item.name === segment && item.type === 'folder');
      if (nextFolder) currentFolder = nextFolder;
      else return null;
    }
    
    return currentFolder;
  };

  const currentFolder = getCurrentFolder();
  
  // Filtered items based on search
  const filteredItems = currentFolder ? 
    currentFolder.children.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) : [];

  // Navigate to folder
  const navigateToFolder = (path) => {
    setCurrentPath(path);
    setSelectedItems([]);
  };

  // Navigate up one level
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    pathSegments.pop();
    const newPath = pathSegments.length === 0 ? '/' : '/' + pathSegments.join('/');
    
    navigateToFolder(newPath);
  };

  // Handle item selection
  const toggleSelectItem = (item) => {
    if (selectedItems.includes(item.path)) {
      setSelectedItems(selectedItems.filter(path => path !== item.path));
    } else {
      setSelectedItems([...selectedItems, item.path]);
    }
  };

  // Handle item double click (open folder or preview file)
  const handleItemDoubleClick = (item) => {
    if (item.type === 'folder') {
      navigateToFolder(item.path);
    } else {
      // In a real app, this would open a file preview
      alert(`Previewing file: ${item.name}`);
    }
  };

  // Create a new folder
  const createNewFolder = () => {
    if (!newFolderName) return;
    
    const updatedFileSystem = {...fileSystem};
    let targetFolder = updatedFileSystem;
    
    if (currentPath !== '/') {
      const pathSegments = currentPath.split('/').filter(segment => segment);
      for (const segment of pathSegments) {
        targetFolder = targetFolder.children.find(item => item.name === segment);
      }
    }
    
    // Create new folder with unique name
    const folderExists = targetFolder.children.some(item => item.name === newFolderName);
    if (folderExists) {
      alert('A folder with this name already exists');
      return;
    }
    
    const newFolder = {
      name: newFolderName,
      type: 'folder',
      path: `${currentPath === '/' ? '' : currentPath}/${newFolderName}`,
      children: []
    };
    
    targetFolder.children.push(newFolder);
    setFileSystem(updatedFileSystem);
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      const updatedFileSystem = {...fileSystem};
      
      for (const itemPath of selectedItems) {
        // Find parent folder of the item
        const pathSegments = itemPath.split('/').filter(segment => segment);
        const itemName = pathSegments.pop();
        let parentFolder = updatedFileSystem;
        
        if (pathSegments.length > 0) {
          for (const segment of pathSegments) {
            parentFolder = parentFolder.children.find(item => item.name === segment);
            if (!parentFolder) break;
          }
        }
        
        if (parentFolder) {
          // Remove item from parent folder
          parentFolder.children = parentFolder.children.filter(item => item.name !== itemName);
        }
      }
      
      setFileSystem(updatedFileSystem);
      setSelectedItems([]);
    }
  };

  // Simulate file upload
  const handleFileUpload = (e) => {
    e.preventDefault();
    const fileName = e.target.elements.fileName.value;
    const fileType = e.target.elements.fileType.value;
    
    if (!fileName) return;
    
    const updatedFileSystem = {...fileSystem};
    let targetFolder = updatedFileSystem;
    
    if (currentPath !== '/') {
      const pathSegments = currentPath.split('/').filter(segment => segment);
      for (const segment of pathSegments) {
        targetFolder = targetFolder.children.find(item => item.name === segment);
      }
    }
    
    // Add new file
    const newFile = {
      name: fileName,
      type: fileType,
      path: `${currentPath === '/' ? '' : currentPath}/${fileName}`,
      size: '1.2 MB',
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    targetFolder.children.push(newFile);
    setFileSystem(updatedFileSystem);
    setShowUploadModal(false);
  };

  // Get icon for file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'folder': return <FolderIcon className="w-5 h-5 text-blue-500" />;
      case 'doc': return <FileTextIcon className="w-5 h-5 text-blue-600" />;
      case 'text': return <FileTextIcon className="w-5 h-5 text-gray-600" />;
      case 'ppt': return <FileTextIcon className="w-5 h-5 text-orange-500" />;
      case 'xls': return <FileTextIcon className="w-5 h-5 text-green-600" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-500" />;
      default: return <FileIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  // Generate breadcrumb navigation
  const renderBreadcrumbs = () => {
    const segments = currentPath.split('/').filter(segment => segment);
    
    return (
      <div className="flex items-center text-sm text-gray-600">
        <span 
          className="cursor-pointer hover:text-blue-600" 
          onClick={() => navigateToFolder('/')}
        >
          My Dropbox
        </span>
        
        {segments.map((segment, index) => {
          const pathToSegment = '/' + segments.slice(0, index + 1).join('/');
          return (
            <React.Fragment key={index}>
              <span className="mx-1">/</span>
              <span 
                className="cursor-pointer hover:text-blue-600"
                onClick={() => navigateToFolder(pathToSegment)}
              >
                {segment}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-blue-600">Dropbox</h1>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search files..."
              className="border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="text-gray-600 hover:bg-gray-100 p-2 rounded-full">
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-white border-r flex-shrink-0 flex flex-col">
          <div className="p-4 flex flex-col space-y-1">
            <button 
              className="flex items-center space-x-2 py-2 px-3 rounded-md bg-blue-100 text-blue-700"
              onClick={() => navigateToFolder('/')}
            >
              <FolderIcon className="w-5 h-5" />
              <span>My Dropbox</span>
            </button>
            
            <button className="flex items-center space-x-2 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100">
              <ImageIcon className="w-5 h-5" />
              <span>Photos</span>
            </button>
            
            <button className="flex items-center space-x-2 py-2 px-3 rounded-md text-gray-700 hover:bg-gray-100">
              <FileTextIcon className="w-5 h-5" />
              <span>Documents</span>
            </button>
          </div>
          
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Storage</span>
              <span className="text-gray-700">7.5 GB / 15 GB</span>
            </div>
            <div className="mt-1 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className="text-gray-600 hover:bg-gray-100 p-2 rounded-md"
                onClick={navigateUp}
                disabled={currentPath === '/'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {renderBreadcrumbs()}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                className="flex items-center space-x-1 text-sm bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-md"
                onClick={() => setShowUploadModal(true)}
              >
                <UploadIcon className="w-4 h-4" />
                <span>Upload</span>
              </button>
              
              <button 
                className="flex items-center space-x-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 px-3 rounded-md"
                onClick={() => setShowNewFolderModal(true)}
              >
                <FolderPlusIcon className="w-4 h-4" />
                <span>New Folder</span>
              </button>
              
              {selectedItems.length > 0 && (
                <button 
                  className="flex items-center space-x-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 py-1.5 px-3 rounded-md"
                  onClick={deleteSelectedItems}
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
              
              <button 
                className={`text-gray-600 hover:bg-gray-100 p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              
              <button 
                className={`text-gray-600 hover:bg-gray-100 p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* File listing */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FolderIcon className="w-16 h-16 mb-2 text-gray-300" />
                <p>{searchTerm ? 'No items match your search' : 'This folder is empty'}</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="grid grid-cols-12 py-2 px-4 border-b text-sm font-medium text-gray-500">
                  <div className="col-span-6">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-3">Modified</div>
                  <div className="col-span-1"></div>
                </div>
                
                {filteredItems.map((item) => (
                  <div 
                    key={item.path}
                    className={`grid grid-cols-12 py-2 px-4 text-sm border-b last:border-0 hover:bg-gray-50 cursor-pointer ${
                      selectedItems.includes(item.path) ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => toggleSelectItem(item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className="col-span-6 flex items-center">
                      <div className="mr-3">{getFileIcon(item.type)}</div>
                      <span>{item.name}</span>
                    </div>
                    <div className="col-span-2 flex items-center text-gray-500">
                      {item.type === 'folder' ? `${item.children?.length || 0} items` : item.size}
                    </div>
                    <div className="col-span-3 flex items-center text-gray-500">
                      {item.lastModified || 'N/A'}
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full">
                        <DownloadIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredItems.map((item) => (
                  <div 
                    key={item.path}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border hover:shadow-md cursor-pointer ${
                      selectedItems.includes(item.path) ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => toggleSelectItem(item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-2">
                      {getFileIcon(item.type)}
                    </div>
                    <span className="text-sm text-center truncate w-full">{item.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Upload File</h3>
            <form onSubmit={handleFileUpload}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name</label>
                <input 
                  type="text" 
                  name="fileName"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
                <select 
                  name="fileType"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="doc">Document (.docx)</option>
                  <option value="ppt">Presentation (.pptx)</option>
                  <option value="xls">Spreadsheet (.xlsx)</option>
                  <option value="text">Text File (.txt)</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button 
                  type="button"
                  className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Create New Folder</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button 
                className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
                onClick={() => setShowNewFolderModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={createNewFolder}
                disabled={!newFolderName}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropboxApp;