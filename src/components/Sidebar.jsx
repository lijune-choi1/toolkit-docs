// src/components/Sidebar.jsx - Updated with dropdown categories and subcategories

import React, { useState, useEffect } from 'react';
import './DropboxStyles.css';
import { getCategoryHierarchy } from '../googleSheetService';

const Sidebar = ({ currentPath, navigateToFolder, fileSystem }) => {
  // State for category hierarchy and expanded categories
  const [categoryHierarchy, setCategoryHierarchy] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch category hierarchy on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const hierarchy = await getCategoryHierarchy();
        setCategoryHierarchy(hierarchy);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching category hierarchy:', error);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Toggle category expansion
  const toggleCategory = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Determine if a path is active
  const isPathActive = (path) => {
    return currentPath === path;
  };

  // Function to render dropdown arrow based on expansion state


  // Function to render dropdown arrow based on expansion state
  const renderDropdownArrow = (categoryName) => {
    const isExpanded = expandedCategories[categoryName];
    return (
      <img 
        src="../assets/custom-icons/icon-arrow-up.svg" 
        className={`dropdown-arrow ${isExpanded ? 'expanded' : 'collapsed'}`}
      />
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-nav">
        {/* All link */}
        <button
          className={`sidebar-nav-item ${isPathActive('/') ? 'active' : ''}`}
          onClick={() => navigateToFolder('/')}
        >
          <span>All</span>
        </button>

        {loading ? (
          <div className="loading-indicator">Loading categories...</div>
        ) : (
          // Render categories from hierarchy
          Object.keys(categoryHierarchy).sort().map((categoryName) => {
            const category = categoryHierarchy[categoryName];
            const hasSubcategories = Object.keys(category.subcategories).length > 0;
            const categoryPath = `/${categoryName}`;
            
            return (
              <div key={categoryName} className="category-container">
                {/* Category header */}
                <button
                  className={`sidebar-nav-item category-header ${isPathActive(categoryPath) ? 'active' : ''}`}
                  onClick={() => {
                    if (hasSubcategories) {
                      toggleCategory(categoryName);
                    }
                    navigateToFolder(categoryPath);
                  }}
                >
                  <span>{categoryName}</span>
                  {hasSubcategories && renderDropdownArrow(categoryName)}
                </button>

                {/* Subcategories (rendered only if category is expanded) */}
                {hasSubcategories && expandedCategories[categoryName] && (
                  <div className="subcategories-container">
                    {Object.keys(category.subcategories).sort().map((subName) => {
                      const subcategory = category.subcategories[subName];
                      const subcategoryPath = `/${categoryName}/${subName}`;
                      
                      return (
                        <button
                          key={`${categoryName}-${subName}`}
                          className={`sidebar-nav-item subcategory-item ${isPathActive(subcategoryPath) ? 'active' : ''}`}
                          onClick={() => navigateToFolder(subcategoryPath)}
                        >
                          <span className="subcategory-label">{subName}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Social Media Links Footer */}
      <div className="sidebar-footer">
        <div className="social-links">
          <a 
            href="https://x.com/ts_designerdocs" 
            className="social-link" 
            aria-label="X (Twitter)" 
            title="Follow us on X"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="social-icon x-icon"></div>
          </a>
          <a 
            href="https://medium.com/@toolkitstudio0" 
            className="social-link" 
            aria-label="Medium" 
            title="Follow us on Medium"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="social-icon medium-icon"></div>
          </a>
        </div>
        <div className="sidebar-footer-text">
          © 2025 ToolkitStudio
        </div>
      </div>
    </div>
  );
};

export default Sidebar;