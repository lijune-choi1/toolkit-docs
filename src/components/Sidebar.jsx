// src/components/Sidebar.jsx - Update to handle dynamic categories

import React from 'react';
import { HardDrive, Folder, FileText, Users, Star } from 'lucide-react';
import './DropboxStyles.css';

const Sidebar = ({ currentPath, navigateToFolder, fileSystem }) => {
  // Generate navigation items based on the categories in the fileSystem
  const renderCategoryFolders = () => {
    if (!fileSystem || !fileSystem.children) {
      return null;
    }

    return fileSystem.children.map((item) => {
      if (item.type === 'folder') {
        return (
          <button
            key={item.path}
            className={`nav-button ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => navigateToFolder(item.path)}
          >
            <div className="folder-icon" style={{ width: '18px', height: '18px' }}></div>
            <span>{item.name}</span>
          </button>
        );
      }
      return null;
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        <button
          className={`nav-button ${currentPath === '/' ? 'active' : ''}`}
          onClick={() => navigateToFolder('/')}
        >
          <HardDrive size={18} />
          <span>Global Toolkit</span>
        </button>

        {/* Category folders - dynamically rendered */}
        {renderCategoryFolders()}

        {/* Additional navigation options */}
        <button className="nav-button">
          <Star size={18} />
          <span>Favorites</span>
        </button>
        
        <button className="nav-button">
          <FileText size={18} />
          <span>Recent</span>
        </button>
      </div>
      
      
    </div>
  );
};

export default Sidebar;