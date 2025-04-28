// src/components/DropboxApp.jsx - Updated to handle all content types

import React, { useState, useEffect } from 'react';
import { File, FileText, Image, Upload, FolderPlus, Trash, Download, Menu, ArrowLeft, RefreshCw, Link, FileDown } from 'lucide-react';
import BlogPost from './BlogPost';
import LinkPost from './LinkPost';
import PDFPost from './PDFPost';
import Sidebar from './Sidebar';
import Navbar from './Navbar'; // Import the Navbar component
import './DropboxStyles.css';
import { fetchAllContent, getCategories, clearCache, getCategoryHierarchy } from '../googleSheetService';

// Add SVG imports for folder icons
// Define paths to SVG files using PUBLIC_URL
const baseFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder.svg`;
const corporateFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-corporate.svg`;
const financeFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-finance.svg`;
const graphicdesignFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-graphicdesign.svg`;
const jobsearchFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-jobsearch.svg`;
const marketingFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-marketing.svg`;
const portfolioFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-portfolio.svg`;
const schoolFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-school.svg`;
const uiuxFolderIcon = `${process.env.PUBLIC_URL}/assets/asset-folder-uiux.svg`;
const resourcesFolderIcon = `${process.env.PUBLIC_URL}/assets/assets-folder-resources.svg`;

const DropboxApp = () => {
  // State for file system - start with a completely empty structure
  const [fileSystem, setFileSystem] = useState({
    name: 'Global Toolkit',
    type: 'folder',
    path: '/',
    children: [] // Keep this empty - will be populated from Google Sheets
  });

  // State for current path and other UI states
  const [currentPath, setCurrentPath] = useState('/');
  const [selectedItems, setSelectedItems] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'list' or 'grid'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showContent, setShowContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // States for subcategory handling
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // States for the new subcategory modal
  const [showNewSubcategoryModal, setShowNewSubcategoryModal] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [parentCategoryForSubcategory, setParentCategoryForSubcategory] = useState('');

  // Fetch content from Google Sheets when the component mounts
  useEffect(() => {
    loadContent();
  }, []);

  // Function to load all content types
  const loadContent = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Get the category hierarchy (includes subcategories)
      const hierarchy = await getCategoryHierarchy(forceRefresh);
      
      // Extract just the categories for the dropdown
      const categoryList = Object.keys(hierarchy).sort();
      setCategories(categoryList);
      
      // Then get all content items
      const content = await fetchAllContent(forceRefresh);
      
      // Create a new file system with the categories as root folders
      const updatedFileSystem = {
        name: 'Global Toolkit',
        type: 'folder',
        path: '/',
        children: categoryList.map(category => {
          // Get subcategories for this category
          const subcategories = Object.keys(hierarchy[category].subcategories || {});
          
          return {
            name: category,
            type: 'folder',
            path: `/${category}`,
            children: [
              // Create folders for each subcategory
              ...subcategories.map(subcategory => ({
                name: subcategory,
                type: 'folder',
                path: `/${category}/${subcategory}`,
                children: [] // Will be filled with content below
              })),
              // Parent category will also have direct content items (those without subcategory)
            ]
          };
        })
      };
      
      // Add content items to their appropriate category or subcategory folders
      content.forEach(item => {
        const category = item.category;
        const subcategory = item.subcategory;
        const contentType = item.contentType;
        
        // Determine file extension based on content type
        let fileExtension;
        switch (contentType) {
          case 'blog':
            fileExtension = '.post';
            break;
          case 'link':
            fileExtension = '.link';
            break;
          case 'pdf':
            fileExtension = '.pdf';
            break;
          default:
            fileExtension = '.item';
        }
        
        console.log(`DEBUG: Processing ${contentType} "${item.title}" with category "${category}" and subcategory "${subcategory || 'none'}"`);
        
        // Find the parent category folder
        const categoryFolder = updatedFileSystem.children.find(folder => folder.name === category);
        
        if (!categoryFolder) {
          console.warn(`Category folder not found for: ${category}`);
          return;
        }
        
        // Determine where to add the item
        if (subcategory) {
          // Find the subcategory folder
          const subcategoryFolder = categoryFolder.children.find(
            folder => folder.type === 'folder' && folder.name === subcategory
          );
          
          if (subcategoryFolder) {
            // Add item to subcategory
            subcategoryFolder.children.push({
              name: `${item.title}${fileExtension}`,
              type: contentType,
              path: item.path,
              size: item.fileSize || '1.2 MB',
              lastModified: item.date,
              content: {
                ...item
              }
            });
          } else {
            console.warn(`Subcategory folder not found: ${subcategory} in ${category}`);
          }
        } else {
          // Add item directly to category folder (no subcategory)
          categoryFolder.children.push({
            name: `${item.title}${fileExtension}`,
            type: contentType,
            path: item.path,
            size: item.fileSize || '1.2 MB',
            lastModified: item.date,
            content: {
              ...item
            }
          });
        }
      });
      
      console.log("DEBUG: Final folder structure:", 
        updatedFileSystem.children.map(folder => {
          const subcategories = folder.children
            .filter(item => item.type === 'folder')
            .map(subfolder => `${subfolder.name}: ${subfolder.children.length} items`);
          
          const directItems = folder.children
            .filter(item => item.type !== 'folder')
            .length;
            
          return `${folder.name}: ${directItems} direct items, subcategories: [${subcategories.join(', ')}]`;
        }));
      
      setFileSystem(updatedFileSystem);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError('Failed to load content');
      setLoading(false);
      setRefreshing(false);
      console.error(err);
    }
  };

  // Function to refresh content
  const refreshContent = () => {
    setRefreshing(true);
    loadContent(true);
  };

  // Function to force a complete refresh
  const forceCompleteRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Clear any local cache
      clearCache();
      
      // Clear browser cache for the Google Sheet URL
      const cacheBuster = Date.now();
      console.log(`Force refreshing with cache buster: ${cacheBuster}`);
      
      // Load content with force refresh
      await loadContent(true);
      
      setRefreshing(false);
      
      // Show a confirmation to the user
      alert('Refresh complete! Data has been fetched directly from Google Sheets.');
    } catch (err) {
      console.error('Error during force refresh:', err);
      setRefreshing(false);
      setError('Failed to force refresh data');
    }
  };

  // Get current folder based on path
  const getCurrentFolder = () => {
    if (currentPath === '/') return fileSystem;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    let currentFolder = fileSystem;
    
    for (const segment of pathSegments) {
      const nextFolder = currentFolder.children.find(item => item.name === segment && (item.type === 'folder' || item.type === 'subcategory'));
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
    setShowContent(null);
  };

  // Navigate up one level
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    pathSegments.pop();
    const newPath = pathSegments.length === 0 ? '/' : '/' + pathSegments.join('/');
    
    navigateToFolder(newPath);
  };

  // Check if current path is a main category
  const isMainCategory = () => {
    if (currentPath === '/') return false;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    return pathSegments.length === 1 && categories.includes(pathSegments[0]);
  };

  // Handle item selection
  const toggleSelectItem = (item) => {
    if (selectedItems.includes(item.path)) {
      setSelectedItems(selectedItems.filter(path => path !== item.path));
    } else {
      setSelectedItems([...selectedItems, item.path]);
    }
  };

  // Handle item double click (open folder or preview content)
  const handleItemDoubleClick = (item) => {
    if (item.type === 'folder') {
      navigateToFolder(item.path);
    } else if (['blog', 'link', 'pdf'].includes(item.type)) {
      if (item.content) {
        setShowContent(item.content);
      }
    } else {
      // For other file types, just show an alert
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

  // Create a new subcategory
  const createNewSubcategory = () => {
    if (!newSubcategoryName || !parentCategoryForSubcategory) return;
    
    const updatedFileSystem = {...fileSystem};
    
    // Find the parent category folder
    const categoryFolder = updatedFileSystem.children.find(
      item => item.name === parentCategoryForSubcategory
    );
    
    if (!categoryFolder) {
      alert(`Parent category "${parentCategoryForSubcategory}" not found`);
      return;
    }
    
    // Check if subcategory already exists
    const subcategoryExists = categoryFolder.children.some(
      item => item.type === 'folder' && item.name === newSubcategoryName
    );
    
    if (subcategoryExists) {
      alert(`A subcategory named "${newSubcategoryName}" already exists in "${parentCategoryForSubcategory}"`);
      return;
    }
    
    // Create new subcategory folder
    const newSubcategoryFolder = {
      name: newSubcategoryName,
      type: 'folder',
      path: `/${parentCategoryForSubcategory}/${newSubcategoryName}`,
      children: []
    };
    
    // Add to parent category
    categoryFolder.children.push(newSubcategoryFolder);
    
    // Update state
    setFileSystem(updatedFileSystem);
    setNewSubcategoryName('');
    setParentCategoryForSubcategory('');
    setShowNewSubcategoryModal(false);
  };

  // Delete selected items
  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
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

  // Handle category change in upload modal
  const handleCategoryChange = async (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    
    // Find subcategories for this category from the file system
    const categoryFolder = fileSystem.children.find(item => item.name === category);
    if (categoryFolder) {
      const folderSubcategories = categoryFolder.children
        .filter(item => item.type === 'folder')
        .map(folder => folder.name);
      
      setSubcategories(folderSubcategories);
    } else {
      setSubcategories([]);
    }
  };

  // Simulate file upload
  const handleFileUpload = (e) => {
    e.preventDefault();
    const fileName = e.target.elements.fileName.value;
    const fileType = e.target.elements.fileType.value;
    const categorySelect = e.target.elements.category;
    const selectedCategory = categorySelect ? categorySelect.value : '';
    
    // Get subcategory if available
    const subcategorySelect = e.target.elements.subcategory;
    const selectedSubcategory = subcategorySelect && subcategorySelect.value !== '' 
      ? subcategorySelect.value 
      : '';
    
    if (!fileName) return;
    
    const updatedFileSystem = {...fileSystem};
    
    // Determine target folder based on selection
    let targetFolder;
    
    if (selectedCategory) {
      // Find category folder
      const categoryFolder = updatedFileSystem.children.find(item => item.name === selectedCategory);
      
      if (!categoryFolder) {
        alert(`Category folder "${selectedCategory}" not found`);
        return;
      }
      
      if (selectedSubcategory) {
        // Find subcategory folder within category
        const subcategoryFolder = categoryFolder.children.find(
          item => item.type === 'folder' && item.name === selectedSubcategory
        );
        
        if (!subcategoryFolder) {
          alert(`Subcategory folder "${selectedSubcategory}" not found in "${selectedCategory}"`);
          return;
        }
        
        targetFolder = subcategoryFolder;
      } else {
        // Use category folder directly (no subcategory)
        targetFolder = categoryFolder;
      }
    } else if (currentPath !== '/') {
      // Try to determine from current path
      const pathSegments = currentPath.split('/').filter(segment => segment);
      let currentFolder = updatedFileSystem;
      
      for (const segment of pathSegments) {
        const nextFolder = currentFolder.children.find(item => item.name === segment);
        if (!nextFolder) {
          alert(`Folder not found for path: ${currentPath}`);
          return;
        }
        currentFolder = nextFolder;
      }
      
      targetFolder = currentFolder;
    } else {
      // Default to root if no category selected and we're at root
      targetFolder = updatedFileSystem;
    }
    
    // Construct path based on target folder
    const filePath = `${targetFolder.path === '/' ? '' : targetFolder.path}/${fileName}`;
    
    // Determine content type based on file type
    let contentType;
    switch (fileType) {
      case 'post':
        contentType = 'blog';
        break;
      case 'link':
        contentType = 'link';
        break;
      case 'pdf':
        contentType = 'pdf';
        break;
      default:
        contentType = fileType;
    }
    
    // Add new file
    const newFile = {
      name: fileName,
      type: contentType,
      path: filePath,
      size: '1.2 MB',
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    // For specific content types, add appropriate content
    if (['blog', 'link', 'pdf'].includes(contentType)) {
      // Determine category and subcategory from target folder path
      let category, subcategory;
      
      if (selectedCategory) {
        category = selectedCategory;
        subcategory = selectedSubcategory;
      } else {
        // Try to extract from path
        const pathSegments = targetFolder.path.split('/').filter(segment => segment);
        category = pathSegments[0] || 'Uncategorized';
        subcategory = pathSegments.length > 1 ? pathSegments[1] : '';
      }
      
      // Create content appropriate to the type
      switch (contentType) {
        case 'blog':
          newFile.content = {
            id: Date.now().toString(),
            title: fileName.replace('.post', ''),
            author: 'New Author',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            category: category,
            subcategory: subcategory,
            contentType: 'blog',
            image: '/api/placeholder/800/400',
            body: '<p>New blog post content goes here. Edit this with your actual content.</p>'
          };
          break;
        case 'link':
          newFile.content = {
            id: Date.now().toString(),
            title: fileName.replace('.link', ''),
            url: 'https://example.com',
            description: 'Add a description for this link',
            category: category,
            subcategory: subcategory,
            contentType: 'link',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            author: 'Link Contributor'
          };
          break;
        case 'pdf':
          newFile.content = {
            id: Date.now().toString(),
            title: fileName.replace('.pdf', ''),
            fileUrl: 'https://example.com/sample.pdf',
            description: 'Add a description for this PDF',
            category: category,
            subcategory: subcategory,
            contentType: 'pdf',
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            author: 'PDF Contributor',
            fileSize: '1.2 MB'
          };
          break;
      }
      
      // Show message to the user about adding to Google Sheet manually
      alert('To make this content persistent, add it to the appropriate Google Sheet tab with these details:\n\n' +
        `Content Type: ${contentType}\n` +
        `ID: ${newFile.content.id}\n` +
        `Title: ${newFile.content.title}\n` +
        `Category: ${newFile.content.category}\n` +
        `Subcategory: ${newFile.content.subcategory || 'None'}\n` +
        `Date: ${newFile.content.date}`
      );
    }
    
    // Add file to target folder
    targetFolder.children.push(newFile);
    setFileSystem(updatedFileSystem);
    
    // Reset form
    setShowUploadModal(false);
    setSelectedCategory('');
    setSubcategories([]);
  };

  // Helper function to determine parent category for any path
  const getParentCategory = (path) => {
    const pathSegments = path.split('/').filter(segment => segment);
    
    // If no segments, return default
    if (!pathSegments.length) return 'default';
    
    // First segment is always the parent category
    const parentCategoryName = pathSegments[0].toLowerCase();
    
    // Map to the three main categories
    if (['corporate', 'finance', 'marketing'].includes(parentCategoryName)) {
      return 'Business';
    } else if (['job search', 'navigating school', 'portfolio'].includes(parentCategoryName)) {
      return 'Career Preparation';
    } else if (['graphic design', 'uiux', 'resources'].includes(parentCategoryName)) {
      return 'Design';
    }
    
    // Return the first segment as fallback
    return pathSegments[0];
  };

// Updated getFileIcon function for DropboxApp.jsx
// Replace the existing getFileIcon function with this one

const getFileIcon = (type, item) => {
  // Handle folders with specific category SVGs
  if (type === 'folder') {
    // Get folder name or path to determine the category
    const folderName = item.name ? item.name.toLowerCase() : '';
    const folderPath = item.path ? item.path.toLowerCase() : '';
    
    // Match folder name to corresponding SVG file
    if (folderName.includes('corporate') || folderPath.includes('corporate')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${corporateFolderIcon})` }}></div>;
    } else if (folderName.includes('finance') || folderPath.includes('finance')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${financeFolderIcon})` }}></div>;
    } else if (folderName.includes('graphic') || folderPath.includes('graphic') || 
               folderName.includes('design') || folderPath.includes('design')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${graphicdesignFolderIcon})` }}></div>;
    } else if (folderName.includes('job') || folderPath.includes('job') || 
               folderName.includes('search') || folderPath.includes('search')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${jobsearchFolderIcon})` }}></div>;
    } else if (folderName.includes('marketing') || folderPath.includes('marketing')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${marketingFolderIcon})` }}></div>;
    } else if (folderName.includes('portfolio') || folderPath.includes('portfolio')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${portfolioFolderIcon})` }}></div>;
    } else if (folderName.includes('school') || folderPath.includes('school') || 
               folderName.includes('education') || folderPath.includes('education')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${schoolFolderIcon})` }}></div>;
    } else if (folderName.includes('ui') || folderPath.includes('ui') || 
               folderName.includes('ux') || folderPath.includes('ux')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${uiuxFolderIcon})` }}></div>;
    } else if (folderName.includes('resource') || folderPath.includes('resource')) {
      return <div className="folder-icon" style={{ backgroundImage: `url(${resourcesFolderIcon})` }}></div>;
    } else {
      // Default folder icon for other categories
      return <div className="folder-icon" style={{ backgroundImage: `url(${baseFolderIcon})` }}></div>;
    }
  }
  
  // Special case for link type - show preview instead of icon
  if (type === 'link') {
    // Extract necessary information from item
    const url = item.content?.url || 'https://example.com';
    let domain = '';
    
    try {
      domain = new URL(url).hostname;
    } catch (e) {
      domain = url;
    }
    
    // Use Google's favicon service
    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    
    // Return link preview rather than just an icon
    return (
      <div className="link-preview">
        <div className="link-preview-header">
          <img 
            src={favicon} 
            alt="" 
            className="link-preview-favicon" 
          />
          <span className="link-preview-domain">{domain}</span>
        </div>
        <div className="link-preview-title">
          {item.name.replace('.link', '')}
        </div>
      </div>
    );
  }
  
  // Handle other file types - these remain unchanged
  switch (type) {
    case 'blog':
    case 'post':
      return <div className="docs-icon"></div>;
    case 'pdf':
      return <FileDown className="file-icon" style={{color: '#dc2626'}} />;
    case 'image': 
      return <Image className="file-icon" style={{color: '#8b5cf6'}} />;
    default: 
      return <File className="file-icon" style={{color: '#6b7280'}} />;
  }
};

// Generate breadcrumb navigation
const renderBreadcrumbs = () => {
  const segments = currentPath.split('/').filter(segment => segment);
  
  return (
    <div className="breadcrumb">
      <span 
        className="breadcrumb-item"
        onClick={() => navigateToFolder('/')}
      >
        Global Toolkit
      </span>
      
      {segments.map((segment, index) => {
        const pathToSegment = '/' + segments.slice(0, index + 1).join('/');
        return (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">/</span>
            <span 
              className="breadcrumb-item"
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

// Render the appropriate content component based on type
const renderContent = () => {
  if (!showContent) return null;
  
  switch (showContent.contentType) {
    case 'blog':
      return <BlogPost post={showContent} />;
    case 'link':
      return <LinkPost post={showContent} />;
    case 'pdf':
      return <PDFPost post={showContent} />;
    default:
      return <div>Unknown content type: {showContent.contentType}</div>;
  }
};

// Replace this content view section in DropboxApp.jsx:

// Updated content view section in DropboxApp.jsx

// If showing content, render appropriate component with integrated navigation
if (showContent) {
  return (
    <div className="app-container">
      <div className="integrated-header">
        <div className="breadcrumb-navigation">
          <button 
            className="back-button"
            onClick={() => setShowContent(null)}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="breadcrumb-path">
            <span 
              className="breadcrumb-item"
              onClick={() => navigateToFolder('/')}
            >
              Global Toolkit
            </span>
            {showContent.category && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span 
                  className="breadcrumb-item"
                  onClick={() => navigateToFolder(`/${showContent.category}`)}
                >
                  {showContent.category}
                </span>
              </>
            )}
            {showContent.subcategory && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span 
                  className="breadcrumb-item"
                  onClick={() => navigateToFolder(`/${showContent.category}/${showContent.subcategory}`)}
                >
                  {showContent.subcategory}
                </span>
              </>
            )}
          </div>
        </div>
        <h1 className="content-title">{showContent.contentType === 'blog' ? showContent.title : ''}</h1>
      </div>
      
      <div className="main-content">
        <Sidebar currentPath={currentPath} navigateToFolder={navigateToFolder} fileSystem={fileSystem} />
        
        <div className="content-container">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// Display loading screen
if (loading) {
  return (
    <div className="app-container">
      <div className="loading-screen">
        <div className="loading-circle"></div>
        <p>Loading content...</p>
      </div>
    </div>
  );
}

// Display error message
if (error) {
  return (
    <div className="app-container">
      <div className="error-message">
        <h3>Error</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={() => loadContent(true)}>
          Try Again
        </button>
      </div>
    </div>
  );
}

return (
  <div className="app-container">
    {/* Use the Navbar component instead of inline header */}
    <Navbar 
      currentPath={currentPath}
      navigateUp={navigateUp}
      navigateToFolder={navigateToFolder}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      setShowUploadModal={setShowUploadModal}
      viewMode={viewMode}
      setViewMode={setViewMode}
      refreshContent={refreshContent}
      forceCompleteRefresh={forceCompleteRefresh}
      refreshing={refreshing}
      renderBreadcrumbs={renderBreadcrumbs}
    />

    {/* Main content */}
    <div className="main-content">
      {/* Sidebar */}
      <Sidebar currentPath={currentPath} navigateToFolder={navigateToFolder} fileSystem={fileSystem} />

      {/* Content area */}
      <div className="content-area">
        {/* Toolbar - Removed as it's now in the Navbar */}
        
        <div className="scrollable-content">
          {/* Title section - only show on main page (currentPath === '/') */}
          {currentPath === '/' && (
            <div className="title-section">
              <h1>A Design Document Library</h1>
              <p>Designer Docs contains guidance and best practices collected by Rhode Island School of Design students and professors, which can help you design your own design career practices.</p>
              <button className="btn btn-primary2">
                Subscribe Biweekly
              </button>
            </div>
          )}

          {/* File listing */}
          <div className="file-container">
            {filteredItems.length === 0 ? (
              <div className="empty-folder">
                <div className="folder-icon" style={{
                  width: '48px', 
                  height: '48px', 
                  marginBottom: '0.5rem',
                  backgroundImage: `url(${baseFolderIcon})`
                }}></div>
                <p>{searchTerm ? 'No items match your search' : 'This folder is empty'}</p>
              </div>
            ) : viewMode === 'list' ? (
              <div className="file-list">
                <div className="file-list-header">
                  <div>Name</div>
                  <div>Type</div>
                  <div>Modified</div>
                  <div></div>
                </div>
                
                {filteredItems.map((item) => (
                  <div 
                    key={item.path}
                    className={`file-item ${selectedItems.includes(item.path) ? 'selected' : ''}`}
                    onClick={() => toggleSelectItem(item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className="file-name">
                      {getFileIcon(item.type, item)}
                      <span>{item.name}</span>
                    </div>
                    <div className="file-type">{item.type}</div>
                    <div className="file-modified">{item.lastModified || '--'}</div>
                    <div className="file-actions">
                      {item.type !== 'folder' && (
                        <button className="btn btn-small">
                          <Download size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="category-sections">
                {(() => {
                  // Function to determine grid category sections based on current path and content
                  const getGridSections = () => {
                    // Default categorization for root/global toolkit
                    if (currentPath === '/') {
                      return [
                        
                        {
                          name: 'Design',
                          color: 'design', // blue theme
                          matcher: (item) => {
                            const path = item.path?.toLowerCase() || "";
                            const category = item.content?.category?.toLowerCase() || "";
                            return (
                              path.includes('graphic design') || 
                              path.includes('uiux') || 
                              path.includes('resources') ||
                              category.includes('graphic') || 
                              category.includes('design') || 
                              category.includes('UIUX') || 
                              category.includes('resources')
                            );
                          }
                        },
                        {
                          name: 'Business',
                          color: 'business', // green theme
                          matcher: (item) => {
                            const path = item.path?.toLowerCase() || "";
                            const category = item.content?.category?.toLowerCase() || "";
                            return (
                              path.includes('corporate') || 
                              path.includes('finance') || 
                              path.includes('marketing') ||
                              category.includes('corporate') || 
                              category.includes('finance') || 
                              category.includes('marketing')
                            );
                          }
                        },
                        {
                          name: 'Career Preparation',
                          color: 'career', // orange theme
                          matcher: (item) => {
                            const path = item.path?.toLowerCase() || "";
                            const category = item.content?.category?.toLowerCase() || "";
                            return (
                              path.includes('job search') || 
                              path.includes('navigating school') || 
                              path.includes('portfolio') ||
                              category.includes('job search') || 
                              category.includes('navigating') || 
                              category.includes('portfolio')
                            );
                          }
                        }
                      ];
                    }
                    
                    // If in a specific category/subcategory, create a single section or no sections
                    const pathSegments = currentPath.split('/').filter(segment => segment);
                    
                    // If we're in a specific category or subcategory
                    if (pathSegments.length > 0) {
                      // Always use the first segment (parent category) to determine color theme
                      const parentCategory = pathSegments[0].toLowerCase();
                      let color = 'default';
                      
                      // Determine color based on parent category (not subcategory)
                      if (['corporate', 'finance', 'marketing'].includes(parentCategory)) {
                        color = 'business';
                      } else if (['job search', 'navigating school', 'portfolio'].includes(parentCategory)) {
                        color = 'career';
                      } else if (['graphic design', 'uiux', 'resources'].includes(parentCategory)) {
                        color = 'design';
                      }
                      
                      // Create the appropriate section
                      return [
                        {
                          name: pathSegments[pathSegments.length - 1],
                          color: color,
                          matcher: (item) => {
                            const path = item.path?.toLowerCase() || "";
                            const category = item.content?.category?.toLowerCase() || "";
                            const searchTerm = pathSegments[pathSegments.length - 1].toLowerCase();
                            
                            return (
                              path.includes(searchTerm) || 
                              category.includes(searchTerm)
                            );
                          }
                        }
                      ];
                    }
                    
                    // Fallback: if no specific categorization is found
                    return [
                      {
                        name: 'All Items',
                        color: 'default',
                        matcher: () => true
                      }
                    ];
                  };
                  
                  // Get grid sections based on current context
                  const gridSections = getGridSections();

                  // Render sections
                  return gridSections.map(section => {
                    // Filter items for this section
                    const sectionItems = filteredItems.filter(section.matcher);
                    
                    // Only render section if it has items
                    if (sectionItems.length === 0) return null;

                    return (
                      <div 
                        key={section.name} 
                        className="category-section" 
                        data-category={section.name}
                        data-parent-category={getParentCategory(currentPath)}
                      >
                        <h2 className="category-heading">{section.name}</h2>
                        <div className="file-grid">
                          {sectionItems.map((item) => {
                            // Determine parent category for this item
                            const parentCategory = getParentCategory(item.path || currentPath);
                            
                            return (
                              <div 
                              key={item.path}
                              className={`grid-item ${selectedItems.includes(item.path) ? 'selected' : ''}`}
                              onClick={() => toggleSelectItem(item)}
                              onDoubleClick={() => handleItemDoubleClick(item)}
                              data-item-category={parentCategory}
                              data-item-type={item.type}
                            >
                              {item.type === 'link' ? (
                                // For link items, render the preview directly in the grid cell
                                getFileIcon(item.type, item)
                              ) : (
                                // For non-link items, use the standard grid layout
                                <>
                                  <div className="grid-item-icon">
                                    {getFileIcon(item.type, item)}
                                  </div>
                                  <div className="grid-item-name">
                                    {item.name}
                                  </div>
                                </>
                              )}
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }).filter(Boolean) // Remove null sections
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Upload modal */}
    {showUploadModal && (
      <div className="modal">
        <div className="modal-content">
          <h3>Submit Document</h3>
          <form onSubmit={handleFileUpload}>
            <div className="form-group">
              <label>File Name</label>
              <input 
                type="text" 
                name="fileName" 
                placeholder="Enter file name"
                required
              />
            </div>
            
            <div className="form-group">
              <label>File Type</label>
              <select name="fileType">
                <option value="post">Blog Post (.post)</option>
                <option value="link">Link (.link)</option>
                <option value="pdf">PDF Document (.pdf)</option>
                <option value="document">Document (.doc)</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Category</label>
              <select 
                name="category"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {selectedCategory && subcategories.length > 0 && (
              <div className="form-group">
                <label>Subcategory</label>
                <select name="subcategory">
                  <option value="">None (add to main category)</option>
                  {subcategories.map(subcat => (
                    <option key={subcat} value={subcat}>{subcat}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* New folder modal */}
    {showNewFolderModal && (
      <div className="modal">
        <div className="modal-content">
          <h3>Create New Folder</h3>
          <div className="form-group">
            <label>Folder Name</label>
            <input 
              type="text" 
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
            />
          </div>
          
          <div className="modal-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowNewFolderModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={createNewFolder}
              disabled={!newFolderName}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}

    {/* New subcategory modal */}
    {showNewSubcategoryModal && (
      <div className="modal">
        <div className="modal-content">
          <h3>Create New Subcategory</h3>
          
          <div className="form-group">
            <label>Parent Category</label>
            <select 
              value={parentCategoryForSubcategory}
              onChange={(e) => setParentCategoryForSubcategory(e.target.value)}
              disabled={parentCategoryForSubcategory !== ''}
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Subcategory Name</label>
            <input 
              type="text" 
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              placeholder="Enter subcategory name"
            />
          </div>
          
          <div className="modal-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowNewSubcategoryModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary"
              onClick={createNewSubcategory}
              disabled={!newSubcategoryName || !parentCategoryForSubcategory}
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