// src/components/DropboxApp.jsx - Updated with improved filtering for subcategories and content types

import React, { useState, useEffect } from 'react';
import { FileDown, Link, Tag, Download, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ContentModal from './ContentModal';
import './DropboxStyles.css';
import { fetchContent, getCategories, clearCache } from '../googleSheetService';

const DropboxApp = () => {
  // State for content and UI
  const [allContent, setAllContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalContent, setModalContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentPath, setCurrentPath] = useState('/');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [contentTypes, setContentTypes] = useState([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  // Load content when component mounts
  useEffect(() => {
    loadContent();
  }, []);

  // Extract unique content types after loading content
  useEffect(() => {
    if (allContent.length > 0) {
      // Extract unique content types
      const types = [...new Set(allContent
        .map(item => item.contentType)
        .filter(type => type && typeof type === 'string')
      )].sort();
      
      console.log('Available content types:', types);
      setContentTypes(types);
    }
  }, [allContent]);
  
  // Trigger content filtering when filters change
  useEffect(() => {
    if (allContent.length > 0) {
      // Log content types before filtering
      const contentTypeCount = allContent.reduce((acc, item) => {
        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Content types before filtering:', contentTypeCount);
      console.log('Selected content types:', selectedContentTypes);
      
      // Small delay to ensure state is updated
      const timeoutId = setTimeout(() => {
        filterContent();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, selectedCategory, allContent, currentPath, selectedContentTypes]);
  
  // Function to load all content
  const loadContent = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Get categories
      const categoryList = await getCategories(forceRefresh);
      setCategories(categoryList);
      
      // Get all content items
      const content = await fetchContent(forceRefresh);
      
      // Check for and handle duplicate IDs
      const contentMap = new Map();
      const duplicates = [];
      
      // First pass - identify duplicates
      content.forEach(item => {
        if (contentMap.has(item.id)) {
          duplicates.push(item.id);
        } else {
          contentMap.set(item.id, item);
        }
      });
      
      // If duplicates found, generate new unique IDs
      let processedContent = content;
      if (duplicates.length > 0) {
        console.warn(`Found ${duplicates.length} duplicate IDs: ${duplicates.join(', ')}`);
        
        // Create new array with unique IDs
        processedContent = content.map((item, index) => {
          // If this is a duplicate ID, create a new unique ID
          if (duplicates.includes(item.id)) {
            return {
              ...item,
              originalId: item.id, // Keep original ID for reference
              id: `${item.id}-${index}` // Create unique ID by appending index
            };
          }
          return item;
        });
        
        console.log(`Processed ${processedContent.length} items and fixed duplicate IDs`);
      }
      
      // Verify content retrieved from googleSheetService
      console.log('Content loaded:', processedContent.length, 'items');
      
      // Debug content types
      const contentTypes = {};
      processedContent.forEach(item => {
        contentTypes[item.contentType] = (contentTypes[item.contentType] || 0) + 1;
      });
      console.log('Content types:', contentTypes);
      
      // Set to state
      setAllContent(processedContent);
      
      // Force initial filtering
      setTimeout(() => {
        filterContent(processedContent);
      }, 50);
      
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      setError('Failed to load content');
      setLoading(false);
      setRefreshing(false);
      console.error(err);
    }
  };
  
  // Improved filterContent function with better subcategory support
  const filterContent = (contentToFilter = null) => {
    let filtered = contentToFilter || [...allContent];
    
    if (filtered.length === 0) {
      console.log('Warning: No content to filter');
      setFilteredContent([]);
      return;
    }
    
    console.log('Starting filtering with', filtered.length, 'items');
    console.log('Current path:', currentPath);
    console.log('Selected category:', selectedCategory);
    console.log('Selected content types:', selectedContentTypes);
    
    // Replace the filter by search term section in filterContent
    if (searchTerm && searchTerm.trim().length > 0) {
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      
      filtered = filtered.filter(item => {
        // Make sure all values are explicitly converted to strings
        const title = String(item.title || '').toLowerCase();
        const description = String(item.description || '').toLowerCase();
        const tagline = String(item.tagline || '').toLowerCase();
        const tags = String(item.tags || '').toLowerCase();
        
        return title.includes(normalizedSearchTerm) || 
              description.includes(normalizedSearchTerm) || 
              tagline.includes(normalizedSearchTerm) || 
              tags.includes(normalizedSearchTerm);
      });
      
      console.log('After search filter:', filtered.length, 'items');
    } else {
      console.log('No search term applied');
    }
    // Filter by content type
    if (selectedContentTypes && selectedContentTypes.length > 0) {
      filtered = filtered.filter(item => {
        return item.contentType && selectedContentTypes.some(type => 
          type.toLowerCase() === item.contentType.toLowerCase()
        );
      });
      console.log('After content type filter:', filtered.length, 'items');
    }
    
    // Filter by selected category or subcategory (path-based)
    if (currentPath !== '/') {
      // Split path into segments to handle both category and subcategory
      const pathSegments = currentPath.split('/').filter(segment => segment);
      console.log('Path segments:', pathSegments);
      
      // If we have at least one segment, it's a category
      if (pathSegments.length >= 1) {
        const pathCategory = pathSegments[0];
        console.log('Filtering by path category:', pathCategory);
        
        // Filter by category
        filtered = filtered.filter(item => {
          const itemCategory = normalizeCategory((item.category || '').toLowerCase());
          const searchCategory = normalizeCategory(pathCategory.toLowerCase());
          
          const categoryMatches = itemCategory === searchCategory ||
            (specialCategoryMappings[itemCategory] === searchCategory) ||
            (specialCategoryMappings[searchCategory] === itemCategory);
          
          return categoryMatches;
        });
        console.log('After category filter:', filtered.length, 'items');
        
        // If we have two segments, it's a subcategory
        if (pathSegments.length >= 2) {
          const subcategory = pathSegments[1];
          console.log('Filtering by subcategory:', subcategory);
          
          // Filter by subcategory (check item.subcategory field)
          filtered = filtered.filter(item => {
            // Check both subcategory and subCategory fields (to handle possible variations)
            const itemSubcategory = (item.subcategory || item.subCategory || '').toLowerCase();
            return normalizeCategory(itemSubcategory) === normalizeCategory(subcategory.toLowerCase());
          });
          console.log('After subcategory filter:', filtered.length, 'items');
        }
      }
    } else if (selectedCategory) {
      // Dropdown filter takes precedence when at root
      console.log('Filtering by dropdown category:', selectedCategory);
      filtered = filtered.filter(item => {
        const itemCategory = normalizeCategory((item.category || '').toLowerCase());
        const searchCategory = normalizeCategory(selectedCategory.toLowerCase());
        
        return itemCategory === searchCategory ||
          (specialCategoryMappings[itemCategory] === searchCategory) ||
          (specialCategoryMappings[searchCategory] === itemCategory);
      });
      console.log('After dropdown filter:', filtered.length, 'items');
    }
    
    // Count content types after filtering
    const filteredTypes = {};
    filtered.forEach(item => {
      filteredTypes[item.contentType] = (filteredTypes[item.contentType] || 0) + 1;
    });
    console.log('Filtered content types:', filteredTypes);
    
    setFilteredContent(filtered);
  };

  // Category name mapping to handle variations in naming
  const specialCategoryMappings = {
    // Proper casing and spacing variations
    'navigatingschool': 'navigating school',
    'navigating_school': 'navigating school',
    'job search': 'jobsearch', 
    'jobsearch': 'job search',
    'job_search': 'job search',
    'graphicdesign': 'graphic design',
    'graphic_design': 'graphic design',
    'uiux': 'ui/ux',
    'ui/ux': 'uiux'
  };

  // Function to normalize category names
  const normalizeCategory = (category) => {
    // Remove spaces, convert to lowercase, and remove special characters
    const normalized = category.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars except spaces
      .trim();
    
    // Remove spaces only for comparison purposes
    return normalized;
  };
  
  // Debug helper function to check content types
  const debugContentTypes = () => {
    const contentTypes = allContent.reduce((acc, item) => {
      acc[item.contentType] = (acc[item.contentType] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Content types in allContent:', contentTypes);
    
    if (filteredContent.length > 0) {
      const filteredTypes = filteredContent.reduce((acc, item) => {
        acc[item.contentType] = (acc[item.contentType] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Content types in filteredContent:', filteredTypes);
    }
  };
  
  // Function to refresh content
  const refreshContent = () => {
    setRefreshing(true);
    loadContent(true);
  };
  
  // Force a complete refresh
  const forceCompleteRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Clear any local cache
      clearCache();
      
      // Load content with force refresh
      await loadContent(true);
      
      setRefreshing(false);
      
      // Show a confirmation to the user
      alert('Refresh complete! Data has been fetched directly from the worksheet.');
    } catch (err) {
      console.error('Error during force refresh:', err);
      setRefreshing(false);
      setError('Failed to force refresh data');
    }
  };
  
  // Function to get the appropriate icon for a content type
  const getContentIcon = (contentType) => {
    switch (contentType) {
      case 'blog':
      case 'Blog':
        return <div className="card-icon blog-icon"></div>;
      case 'link':
      case 'Link':
        return <Link className="card-icon" size={24} />;
      case 'pdf':
      case 'Pdf':
      case 'PDF':
        return <FileDown className="card-icon" size={24} style={{color: '#dc2626'}} />;
      default:
        return null;
    }
  };
  
  // Function to get the favicon for a link
  const getLinkFavicon = (url) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return null;
    }
  };
  
  // Function to handle item click (open modal)
  const handleItemClick = (item) => {
    setModalContent(item);
  };
  
  // Close modal
  const closeModal = () => {
    setModalContent(null);
  };
  
  // Handle navigation from sidebar
  const handleNavigateToFolder = (path) => {
    console.log('Navigating to folder:', path);
    
    // Update current path
    setCurrentPath(path);
    
    // Clear the dropdown selection when using sidebar navigation
    if (path !== '/') {
      setSelectedCategory('');
    }
    
    // Close modal if open
    if (modalContent) {
      setModalContent(null);
    }
    
    // Force filtering specifically for this path
    setTimeout(() => {
      console.log('Filtering after navigation to:', path);
      filterContent();
    }, 50);
  };
  
  // Navigate up one level
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const pathSegments = currentPath.split('/').filter(segment => segment);
    pathSegments.pop();
    const newPath = pathSegments.length === 0 ? '/' : '/' + pathSegments.join('/');
    
    handleNavigateToFolder(newPath);
  };
  
  // Generate breadcrumb navigation
  const renderBreadcrumbs = () => {
    const segments = currentPath.split('/').filter(segment => segment);
    
    return (
      <div className="breadcrumb">
        <span 
          className="breadcrumb-item"
          onClick={() => handleNavigateToFolder('/')}
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
                onClick={() => handleNavigateToFolder(pathToSegment)}
              >
                {segment}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  
  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
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
      {/* Debug button - comment out in production */}
      <button 
        onClick={debugContentTypes} 
        style={{position: 'fixed', bottom: 10, right: 10, zIndex: 1000, padding: '5px 10px', fontSize: '12px'}}
      >
        Debug
      </button>
      
      {/* Use the Navbar component */}
      <Navbar 
        currentPath={currentPath}
        navigateUp={navigateUp}
        navigateToFolder={handleNavigateToFolder}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        viewMode={viewMode}
        setViewMode={setViewMode}
        refreshContent={refreshContent}
        forceCompleteRefresh={forceCompleteRefresh}
        refreshing={refreshing}
        renderBreadcrumbs={renderBreadcrumbs}
        contentTypes={contentTypes}
        selectedContentTypes={selectedContentTypes}
        setSelectedContentTypes={setSelectedContentTypes}
      />
      
      {/* Main content */}
      <div className="main-content">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar 
            currentPath={currentPath} 
            navigateToFolder={handleNavigateToFolder} 
            fileSystem={{
              children: categories.map(cat => ({ name: cat, type: 'folder', path: `/${cat}` }))
            }} 
          />
        )}
        
        {/* Content area with card view */}
        <div className="content-area">
          <div className="scrollable-content">
            {/* Title section - only show on main page (currentPath === '/') */}
            {currentPath === '/' && (
              <div className="title-section">
                <button className="btn btn-primary3">
                  ToolkitStudio
                </button>
                <h1>Sharing and Collecting Free Resources for Early Career Designers + Students</h1>
                <h3>Originally started for resources for Rhode Island School of Design Students</h3>
                
                {/* Email Subscription Form */}
                <div className="email-subscribe-container">
                  <input 
                    type="email" 
                    placeholder="Email address" 
                    className="email-input"
                    aria-label="Email address for subscription"
                  />
                  <button className="btn btn-signup">Sign up</button>
                </div>
                <p className="subscribe-description">Join weekly resources from +1,000 RISD students</p>
              </div>
            )}
            
            {/* Display current category/subcategory if one is selected */}
            {currentPath !== '/' && (
              <h2 className="selected-category-heading">
                {currentPath.split('/').filter(segment => segment).join(' > ')}
              </h2>
            )}
            
            {/* Card or List view based on viewMode */}
            {viewMode === 'grid' ? (
              <div className="card-grid">
                {filteredContent.length === 0 ? (
                  <div className="empty-content">
                    <p>{searchTerm || currentPath !== '/' ? 'No items match your selection' : 'No content available'}</p>
                  </div>
                ) : (
                  filteredContent.map((item) => {
                    // Determine card style based on content type
                    let cardClass = "content-card";
                    if (item.contentType === 'Blog') cardClass += " blog-card";
                    if (item.contentType === 'Link') cardClass += " link-card";
                    if (item.contentType === 'Pdf' || item.contentType === 'PDF') cardClass += " pdf-card";
                    
                    // Get URL - look for different URL properties
                    const url = item.url || item.fileUrl || item.videoUrl || item.toolUrl || 
                              item.bookUrl || item.articleUrl || item.podcastUrl || item.tweetUrl;
                    
                    return (
                      <div 
                        key={item.id}
                        className={cardClass}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="card-header">
                          {/* Icon based on content type or favicon */}
                          {url ? (
                            <img 
                              src={getLinkFavicon(url)} 
                              alt="" 
                              className="link-favicon" 
                            />
                          ) : (
                            getContentIcon(item.contentType)
                          )}
                          
                          <div className="card-badges">
                            <span className="content-type-badge">{item.contentType}</span>
                          </div>
                        </div>
                        
                        <h3 className="card-title">{item.title}</h3>
                        
                        {item.tagline && (
                          <p className="card-tagline">{item.tagline}</p>
                        )}
                        
                        {item.description && (
                          <p className="card-description">{item.description}</p>
                        )}
                        
                        {/* Tags section - moved below description */}
                        {item.tags && (
                          <div className="card-tags">
                            {item.tags.split(',').map((tag, index) => (
                              <span key={index} className="card-tag">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Category displayed as a tag */}
                        {item.category && (
                          <div className="card-category-container">
                            <span className="card-category">
                              {item.category}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="file-list">
                <div className="file-list-header">
                  <div>Name</div>
                  <div>Type</div>
                  <div>Category</div>
                  <div>Modified</div>
                  <div></div>
                </div>
                
                {filteredContent.length === 0 ? (
                  <div className="empty-list-message">
                    <p>{searchTerm || currentPath !== '/' ? 'No items match your selection' : 'No content available'}</p>
                  </div>
                ) : (
                  filteredContent.map((item) => {
                    // Determine list item style based on content type
                    let itemClass = "list-item";
                    if (item.contentType === 'Blog') itemClass += " blog-item";
                    if (item.contentType === 'Link') itemClass += " link-item";
                    if (item.contentType === 'Pdf' || item.contentType === 'PDF') itemClass += " pdf-item";
                    
                    // Get URL - look for different URL properties
                    const url = item.url || item.fileUrl || item.videoUrl || item.toolUrl || 
                                item.bookUrl || item.articleUrl || item.podcastUrl || item.tweetUrl;
                    
                    return (
                      <div 
                        key={item.id}
                        className={itemClass}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="list-item-name">
                          {/* Icon based on content type or favicon */}
                          {url ? (
                            <img 
                              src={getLinkFavicon(url)} 
                              alt="" 
                              className="list-favicon" 
                            />
                          ) : (
                            getContentIcon(item.contentType)
                          )}
                          <span>{item.title}</span>
                        </div>
                        <div className="list-item-type">{item.contentType}</div>
                        <div className="list-item-category">{item.category}</div>
                        <div className="list-item-modified">{item.dateAdded || 'Unknown'}</div>
                        <div className="list-item-actions">
                          <button className="btn btn-small">
                            <Download size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Content Modal */}
      {modalContent && (
        <ContentModal 
          content={modalContent} 
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default DropboxApp;