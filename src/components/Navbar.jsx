// src/components/Navbar.jsx - Updated with custom logo icon

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Menu, RefreshCw, ChevronDown, Search, Check } from 'lucide-react';
import SubmitModal from './SubmitModal';
import { submitForm } from '../submissionService';
import './SubmitModal.css';

const Navbar = ({
  currentPath,
  navigateUp,
  navigateToFolder,
  searchTerm,
  setSearchTerm,
  refreshContent,
  forceCompleteRefresh,
  refreshing,
  renderBreadcrumbs,
  // Content type filtering props
  contentTypes = [],
  selectedContentTypes = [],
  setSelectedContentTypes,
  // Content view mode props
  showBackButton = false,
  onBack = null,
  title = null
}) => {
  // State for submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  // State for filter dropdown visibility
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  // Reference to the filter dropdown
  const filterMenuRef = useRef(null);
  
  // Default content types if none provided
  const defaultContentTypes = ['Link', 'Video', 'PDF', 'Tool', 'Book', 'Article', 'Podcast', 'Tweet'];
  
  // Use provided content types or defaults
  const availableContentTypes = 
    contentTypes.length > 0 ? contentTypes : defaultContentTypes;

  // Initialize local selected filter state only once (not on every render)
  const [localSelectedTypes, setLocalSelectedTypes] = useState(selectedContentTypes || []);

  // Update local state ONLY when the prop changes from outside
  // This prevents the infinite update loop
  useEffect(() => {
    // Check if arrays are different before updating
    const areArraysDifferent = () => {
      if (localSelectedTypes.length !== selectedContentTypes.length) return true;
      return localSelectedTypes.some(type => !selectedContentTypes.includes(type));
    };

    // Only update if they're actually different
    if (selectedContentTypes && areArraysDifferent()) {
      setLocalSelectedTypes(selectedContentTypes);
    }
  }, [selectedContentTypes]);  // Only depend on the external prop

  // Handle form submission to Google Sheets or email
  const handleSubmit = async (formData) => {
    try {
      await submitForm(formData);
      return true;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };

  // Handle content type checkbox toggle
  const handleContentTypeToggle = (type) => {
    const updatedTypes = localSelectedTypes.includes(type)
      ? localSelectedTypes.filter(t => t !== type)
      : [...localSelectedTypes, type];
    
    setLocalSelectedTypes(updatedTypes);
  };

  // Apply filters - only call parent update when user clicks Apply
  const applyFilters = () => {
    if (setSelectedContentTypes) {
      setSelectedContentTypes(localSelectedTypes);
    }
    setShowFilterMenu(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setLocalSelectedTypes([]);
    if (setSelectedContentTypes) {
      setSelectedContentTypes([]);
    }
    setShowFilterMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // If in content view mode, show a simplified navbar
  if (showBackButton && onBack) {
    return (
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="btn btn-secondary"
              onClick={onBack}
              style={{marginRight: '20px'}}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="logo-container">
              <div className="navbar-icon logo-icon"></div>
              <h1 className="app-title">{title || 'Toolkit+DesignerDocs'}</h1>
            </div>
          </div>
          
          <div className="header-center">
            {/* Centered search in content view */}
            {setSearchTerm && (
              <div className="search-container">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search across documents..."
                  className="search-input"
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
          
          <div className="header-right">
            {/* Menu button */}
            <button className="btn">
              <Menu size={18} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Otherwise, show the full navbar for folder view
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="logo-container">
            <div className="navbar-icon logo-icon"></div>
            <h1 className="app-title">DesignerDocs</h1>
          </div>
        </div>
        
        <div className="header-center">
          {/* Centered search bar with filter button */}
          <div className="search-filter-container">
            {/* Filter button and menu */}
            <div className="filter-dropdown-container" ref={filterMenuRef}>
              <button 
                className={`filter-button ${localSelectedTypes.length > 0 ? 'has-filters' : ''}`}
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                aria-expanded={showFilterMenu}
                aria-controls="filter-menu"
              >
                <span className="filter-button-text">
                  {localSelectedTypes.length > 0 
                    ? `Filters (${localSelectedTypes.length})` 
                    : 'Filter'}
                </span>
                <ChevronDown size={16} />
                {localSelectedTypes.length > 0 && (
                  <span className="filter-count">{localSelectedTypes.length}</span>
                )}
              </button>
              
              {showFilterMenu && (
                <div className="filter-menu" id="filter-menu">
                  <div className="filter-menu-header">
                    <h3>Filter by Content Type</h3>
                    <button 
                      className="filter-clear-button"
                      onClick={clearFilters}
                    >
                      Clear all
                    </button>
                  </div>
                  
                  <div className="filter-options">
                    {availableContentTypes.map(type => (
                      <label key={type} className="filter-checkbox-label">
                        <div className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={localSelectedTypes.includes(type)}
                            onChange={() => handleContentTypeToggle(type)}
                            className="filter-checkbox"
                          />
                          <div className="custom-checkbox">
                            {localSelectedTypes.includes(type) && <Check size={12} />}
                          </div>
                        </div>
                        <span>{type}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="filter-menu-footer">
                    <button 
                      className="filter-apply-button"
                      onClick={applyFilters}
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Search input */}
            <div className="search-container">
              <Search className="search-icon" size={16} />
              <input
                type="text"
                placeholder="Search files..."
                className="search-input"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="header-right">
          {/* Submit button with custom icon */}
          <button 
            className="btn btn-primary submit-btn"
            onClick={() => setShowSubmitModal(true)}
            aria-label="Submit"
          >
            <div className="navbar-icon submit-icon"></div>
            <span>Submit</span>
          </button>
          
          {/* Refresh button */}
          <button
            className="btn btn-secondary"
            onClick={refreshContent}
            disabled={refreshing}
            title="Refresh content"
            style={{padding: '0.375rem', display: 'flex', alignItems: 'center', justifyContent: 'center'}}
          >
            <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>
      
      {/* Active filters display */}
      {localSelectedTypes.length > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">Active filters:</span>
          <div className="filter-tags">
            {localSelectedTypes.map(type => (
              <div key={type} className="filter-tag">
                <span>{type}</span>
                <button 
                  className="filter-tag-remove"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    const newTypes = localSelectedTypes.filter(t => t !== type);
                    setLocalSelectedTypes(newTypes);
                    setSelectedContentTypes(newTypes);
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
            
            <button 
              className="clear-all-tags"
              onClick={clearFilters}
            >
              Clear all
            </button>
          </div>
        </div>
      )}
      
      {/* Submit Modal */}
      <SubmitModal 
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={handleSubmit}
      />
    </header>
  );
};

export default Navbar;