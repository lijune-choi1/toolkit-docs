// src/components/Sidebar.jsx - Corrected with proper categories

import React from 'react';
import './DropboxStyles.css';

const Sidebar = ({ currentPath, navigateToFolder, fileSystem }) => {
  // Get folders from fileSystem if available
  const getFoldersFromFileSystem = () => {
    if (!fileSystem || !fileSystem.children) {
      return [];
    }
    return fileSystem.children
      .filter(item => item.type === 'folder')
      .map(folder => ({
        name: folder.name,
        path: folder.path,
        active: currentPath === folder.path
      }));
  };

  // Define the categories structure based on your Dropbox structure
  const mainCategories = [
    { 
      name: 'All', 
      path: '/', 
      icon: 'all',
      active: currentPath === '/'
    },
    {
      name: 'Business',
      isHeader: true
    },
    { 
      name: 'Corporate', 
      path: '/Corporate', 
      icon: 'corporate',
      active: currentPath === '/Corporate'
    },
    { 
      name: 'Finance', 
      path: '/Finance', 
      icon: 'finance',
      active: currentPath === '/Finance'
    },
    { 
      name: 'Marketing', 
      path: '/Marketing', 
      icon: 'marketing',
      active: currentPath === '/Marketing'
    },
    {
      name: 'Career Preparation',
      isHeader: true
    },
    { 
      name: 'Job Search', 
      path: '/Job Search', 
      icon: 'jobsearch',
      active: currentPath === '/Job Search'
    },
    { 
      name: 'Navigating School', 
      path: '/Navigating School', 
      icon: 'school',
      active: currentPath === '/Navigating School'
    },
    { 
      name: 'Portfolio', 
      path: '/Portfolio', 
      icon: 'portfolio',
      active: currentPath === '/Portfolio'
    },
    {
      name: 'Design',
      isHeader: true
    },
    { 
      name: 'Graphic Design', 
      path: '/Graphic Design', 
      icon: 'design',
      active: currentPath === '/Graphic Design'
    },
    { 
      name: 'UIUX', 
      path: '/UIUX', 
      icon: 'uiux',
      active: currentPath === '/UIUX'
    },
    { 
      name: 'Resources', 
      path: '/Resources', 
      icon: 'resources',
      active: currentPath === '/Resources'
    },
    {
      name: 'Templates',
      isHeader: false,
      path: '/Templates',
      icon: 'templates',
      active: currentPath === '/Templates'
    }
  ];

  // Determine which list to use - dynamic from fileSystem or static
  const categories = fileSystem && fileSystem.children && fileSystem.children.length > 0 
    ? [{ name: 'All', path: '/', icon: 'all', active: currentPath === '/' }]
    : mainCategories;

  // Function to categorize folders into our main categories
  const categorizeFolders = (folders) => {
    // Initialize category structure
    const categorized = {
      'Business': [],
      'Career Preparation': [],
      'Design': [],
      'Other': []
    };

    // Categorize each folder
    folders.forEach(folder => {
      const name = folder.name.toLowerCase();
      
      if (name === 'corporate' || name === 'finance' || name === 'marketing') {
        categorized['Business'].push(folder);
      } 
      else if (name === 'job search' || name === 'navigating school' || name === 'portfolio') {
        categorized['Career Preparation'].push(folder);
      }
      else if (name === 'graphic design' || name === 'uiux' || name === 'resources') {
        categorized['Design'].push(folder);
      }
      else {
        categorized['Other'].push(folder);
      }
    });

    return categorized;
  };

  // Get folders from the file system
  const folders = getFoldersFromFileSystem();
  const categorizedFolders = categorizeFolders(folders);

  // Icon mapping
  const iconMapping = {
    'corporate': 'corporate',
    'finance': 'finance',
    'marketing': 'marketing',
    'job search': 'jobsearch',
    'navigating school': 'school',
    'portfolio': 'portfolio',
    'graphic design': 'design',
    'uiux': 'uiux',
    'resources': 'resources',
    'templates': 'templates'
  };

  // Function to render the icon based on category
  const renderIcon = (folderName) => {
    const iconKey = folderName.toLowerCase();
    const iconClass = iconMapping[iconKey] || 'folder';
    
    return <div className={`sidebar-icon ${iconClass}-icon`}></div>;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {/* All folders link */}
        <button
          className={`sidebar-nav-item ${currentPath === '/' ? 'active' : ''}`}
          onClick={() => navigateToFolder('/')}
        >
          <div className="sidebar-icon all-icon"></div>
          <span>All</span>
        </button>

        {/* If we have folders, render the categorized version */}
        {folders.length > 0 ? (
          <>
            {/* Business category */}
            {categorizedFolders['Business'].length > 0 && (
              <>
                <div className="sidebar-category-header">Business</div>
                {categorizedFolders['Business'].map((folder, index) => (
                  <button
                    key={`business-${index}`}
                    className={`sidebar-nav-item ${folder.active ? 'active' : ''}`}
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    {renderIcon(folder.name)}
                    <span>{folder.name}</span>
                  </button>
                ))}
              </>
            )}

            {/* Career Preparation category */}
            {categorizedFolders['Career Preparation'].length > 0 && (
              <>
                <div className="sidebar-category-header">Career Preparation</div>
                {categorizedFolders['Career Preparation'].map((folder, index) => (
                  <button
                    key={`career-${index}`}
                    className={`sidebar-nav-item ${folder.active ? 'active' : ''}`}
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    {renderIcon(folder.name)}
                    <span>{folder.name}</span>
                  </button>
                ))}
              </>
            )}

            {/* Design category */}
            {categorizedFolders['Design'].length > 0 && (
              <>
                <div className="sidebar-category-header">Design</div>
                {categorizedFolders['Design'].map((folder, index) => (
                  <button
                    key={`design-${index}`}
                    className={`sidebar-nav-item ${folder.active ? 'active' : ''}`}
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    {renderIcon(folder.name)}
                    <span>{folder.name}</span>
                  </button>
                ))}
              </>
            )}

            {/* Other folders that don't fit categories */}
            {categorizedFolders['Other'].length > 0 && (
              <>
                {categorizedFolders['Other'].map((folder, index) => (
                  <button
                    key={`other-${index}`}
                    className={`sidebar-nav-item ${folder.active ? 'active' : ''}`}
                    onClick={() => navigateToFolder(folder.path)}
                  >
                    <div className="sidebar-icon folder-icon"></div>
                    <span>{folder.name}</span>
                  </button>
                ))}
              </>
            )}
          </>
        ) : (
          // Fallback to static categories if no folders exist
          mainCategories.slice(1).map((category, index) => {
            if (category.isHeader) {
              return (
                <div key={`header-${index}`} className="sidebar-category-header">
                  {category.name}
                </div>
              );
            }
            
            return (
              <button
                key={`nav-${index}`}
                className={`sidebar-nav-item ${category.active ? 'active' : ''}`}
                onClick={() => navigateToFolder(category.path)}
              >
                <div className={`sidebar-icon ${category.icon}-icon`}></div>
                <span>{category.name}</span>
              </button>
            );
          })
        )}

        {/* Templates as a special item at the bottom */}
        <button
          className={`sidebar-nav-item ${currentPath === '/Templates' ? 'active' : ''}`}
          onClick={() => navigateToFolder('/Templates')}
        >
          <div className="sidebar-icon templates-icon"></div>
          <span>Templates</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;