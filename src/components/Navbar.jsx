// src/components/Navbar.jsx with updated toggle buttons
import React, { useState } from 'react';
import { ArrowLeft, Upload, Menu, RefreshCw, Grid, List } from 'lucide-react';
import SubmitModal from './SubmitModal';
import { submitForm } from '../submissionService';
import './SubmitModal.css';

const Navbar = ({
  currentPath,
  navigateUp,
  navigateToFolder,
  searchTerm,
  setSearchTerm,
  setShowUploadModal,
  viewMode,
  setViewMode,
  refreshContent,
  forceCompleteRefresh,
  refreshing,
  renderBreadcrumbs,
  // New props for content view mode
  showBackButton = false,
  onBack = null,
  title = null
}) => {
  // State for submit modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);

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
            <h1 className="app-title">{title || 'Toolkit+DesignerDocs'}</h1>
          </div>
          
          <div className="header-right">
            {/* Keep search bar in content view */}
            {setSearchTerm && (
              <input
                type="text"
                placeholder="Search across documents..."
                className="search-bar"
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            )}
            
            {/* Menu button */}
            <button className="btn">
              <Menu size={18} />
            </button>
          </div>
        </div>
        
        {/* Submit Modal */}
        <SubmitModal 
          isOpen={showSubmitModal}
          onClose={() => setShowSubmitModal(false)}
          onSubmit={handleSubmit}
        />
      </header>
    );
  }

  // Otherwise, show the full navbar for folder view
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="app-title">Toolkit+DesignerDocs</h1>
          
          {/* Show breadcrumbs and back button only when not on root path */}
          {currentPath !== '/' && (
            <div className="inline-breadcrumb">
              <button 
                className="btn btn-secondary"
                onClick={navigateUp}
                disabled={currentPath === '/'}
                style={{marginRight: '8px', marginLeft:'24px'}}
              >
                <ArrowLeft size={18} />
              </button>
              {renderBreadcrumbs && renderBreadcrumbs()}
            </div>
          )}
        </div>
        
        <div className="header-right">
          <input
            type="text"
            placeholder="Search files..."
            className="search-bar"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* Submit button - Updated to open submission modal */}
          <button 
            className="btn btn-primary"
            onClick={() => setShowSubmitModal(true)}
          >
            <span>Submit</span>
          </button>
          
          {/* Round view toggle buttons */}
          <div className="view-toggle-wrapper">
            <div className="view-toggle-container">
              <button 
                className={`view-toggle-button ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <Grid size={18} />
              </button>
              
              <button 
                className={`view-toggle-button ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
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