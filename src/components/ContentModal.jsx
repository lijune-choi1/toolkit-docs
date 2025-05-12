// src/components/ContentModal.jsx - Fixed to open related content in modal
import React, { useEffect, useRef, useState } from 'react';
import './ContentModal.css';
import { fetchContent } from '../googleSheetService';

const ContentModal = ({ content, onClose }) => {
  const modalRef = useRef(null);
  const [linkPreview, setLinkPreview] = useState(null);
  const [allContent, setAllContent] = useState([]);
  const [relatedContent, setRelatedContent] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [relatedPreviews, setRelatedPreviews] = useState({});
  const [currentContent, setCurrentContent] = useState(null);

  // Initialize current content when the modal opens
  useEffect(() => {
    if (content) {
      setCurrentContent(content);
    }
  }, [content]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close modal with escape key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  // Prevent scroll on body when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Fetch all content for related items
  useEffect(() => {
    const getContentData = async () => {
      try {
        const contentData = await fetchContent(true);
        setAllContent(contentData);
      } catch (error) {
        console.error('Error fetching content for related items:', error);
      }
    };
    
    getContentData();
  }, []);

  // Reset states when current content changes
  useEffect(() => {
    // Reset preview states
    setPreviewImage(null);
    setPreviewLoading(false);
    setPreviewError(false);
    setLinkPreview(null);
    
    if (!currentContent) return;
    
    // Get the appropriate URL based on content type
    const url = getContentUrl(currentContent);
    if (url) {
      // Try to get preview info
      getLinkPreview(url);
      
      // Try to get a preview image for the website
      getWebsitePreview(url, setPreviewImage, setPreviewLoading, setPreviewError);
    }
    
    // Find related content once we have both current content and all content
    if (allContent.length > 0) {
      const related = findRelatedContent(currentContent, allContent);
      setRelatedContent(related);
    }
  }, [currentContent, allContent]);

  // Load preview images for related content
  useEffect(() => {
    if (relatedContent.length > 0) {
      // Process each related content item to get preview
      relatedContent.forEach(item => {
        const url = getContentUrl(item);
        if (url) {
          getWebsitePreview(
            url, 
            (image) => {
              setRelatedPreviews(prev => ({
                ...prev,
                [item.id]: image
              }));
            },
            null,
            null
          );
        }
      });
    }
  }, [relatedContent]);

  // Function to get a preview image for a website
  const getWebsitePreview = (url, setImage, setLoading, setError) => {
    if (!url) return;
    
    if (setLoading) setLoading(true);
    if (setError) setError(false);
    
    try {
      // Use Microlink screenshot service
      const encodedUrl = encodeURIComponent(url);
      const previewUrl = `https://api.microlink.io/?url=${encodedUrl}&screenshot=true&meta=false&embed=screenshot.url`;
      
      // Fallback to favicon if needed
      const domain = new URL(url).hostname;
      const fallbackUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      
      // Load the image to test if it works
      const img = new Image();
      
      img.onload = () => {
        if (setImage) setImage(previewUrl);
        if (setLoading) setLoading(false);
      };
      
      img.onerror = () => {
        // If Microlink fails, try fallback
        console.error('Microlink preview failed, using favicon fallback');
        if (setImage) setImage(fallbackUrl);
        if (setLoading) setLoading(false);
      };
      
      // Start loading the image
      img.src = previewUrl;
    } catch (error) {
      console.error('Error getting website preview:', error);
      if (setError) setError(true);
      if (setLoading) setLoading(false);
    }
  };

  // Handler for clicking on a related item - changes current content in modal
  const handleRelatedItemClick = (item, e) => {
    e.preventDefault(); // Prevent default link behavior
    setCurrentContent(item);
    
    // Scroll to top of modal
    if (modalRef.current) {
      const contentElement = modalRef.current.querySelector('.modal-content');
      if (contentElement) {
        contentElement.scrollTop = 0;
      }
    }
  };

  if (!currentContent) return null;

  // Find related content based on tags and categories
  const findRelatedContent = (currentContentItem, allContentItems) => {
    if (!currentContentItem || !allContentItems || allContentItems.length === 0) return [];
    
    // Get current content's category, subcategory, and tags
    const { category, subcategory, contentType, tags, author } = currentContentItem;
    
    // Extract tags from the tags string (assuming comma-separated)
    const currentTags = tags ? tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
    
    // Filter out the current content and find related items
    const related = allContentItems
      .filter(item => item.id !== currentContentItem.id) // Exclude current content
      .map(item => {
        // Calculate a relevance score
        let score = 0;
        
        // Same category (high relevance)
        if (item.category === category) score += 5;
        
        // Same subcategory (even higher relevance)
        if (subcategory && item.subcategory === subcategory) score += 3;
        
        // Same content type (moderate relevance)
        if (item.contentType === contentType) score += 2;
        
        // Count matching tags
        const itemTags = item.tags ? item.tags.split(',').map(tag => tag.trim().toLowerCase()) : [];
        const matchingTags = itemTags.filter(tag => currentTags.includes(tag));
        score += matchingTags.length * 2; // Each matching tag adds points
        
        // Same author (high relevance)
        if (item.author === author) score += 4;
        
        return { ...item, relevanceScore: score };
      })
      .filter(item => item.relevanceScore > 0) // Only keep items with some relevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
      .slice(0, 4); // Take top 4
      
    return related;
  };

  // Get the URL for any content type
  const getContentUrl = (contentItem) => {
    if (!contentItem) return null;
    
    // Check different URL properties based on content type
    if (contentItem.url) return contentItem.url;
    if (contentItem.fileUrl) return contentItem.fileUrl;
    if (contentItem.videoUrl) return contentItem.videoUrl;
    if (contentItem.toolUrl) return contentItem.toolUrl;
    if (contentItem.bookUrl) return contentItem.bookUrl;
    if (contentItem.articleUrl) return contentItem.articleUrl;
    if (contentItem.podcastUrl) return contentItem.podcastUrl;
    if (contentItem.tweetUrl) return contentItem.tweetUrl;
    
    // If no specific URL property is found
    return null;
  };

  // Get the URL for action button
  const getActionUrl = () => {
    return getContentUrl(currentContent);
  };

  // Get favicon for links
  const getFavicon = (url) => {
    if (!url) return null;
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (e) {
      return null;
    }
  };

  // Get link preview info - simplified version
  const getLinkPreview = (url) => {
    if (!url) {
      setLinkPreview(null);
      return;
    }
    
    try {
      const domain = new URL(url).hostname;
      setLinkPreview({
        url: url,
        domain: domain,
        favicon: getFavicon(url)
      });
    } catch (e) {
      setLinkPreview(null);
    }
  };

  // Determine icon based on content type
  const getContentIcon = (contentItem) => {
    const url = getContentUrl(contentItem);
    
    switch (contentItem.contentType) {
      case 'link':
        return url ? (
          <img 
            src={getFavicon(url)} 
            alt="" 
            className="content-icon" 
          />
        ) : <span className="content-icon">🔗</span>;
      case 'pdf':
        return <span className="content-icon">📄</span>;
      case 'video':
        return <span className="content-icon">🎬</span>;
      case 'tool':
        return <span className="content-icon">🔧</span>;
      case 'book':
        return <span className="content-icon">📚</span>;
      case 'article':
        return <span className="content-icon">📰</span>;
      case 'podcast':
        return <span className="content-icon">🎙️</span>;
      case 'tweet':
        return <span className="content-icon">🐦</span>;
      default:
        return url ? (
          <img 
            src={getFavicon(url)} 
            alt="" 
            className="content-icon" 
          />
        ) : <span className="content-icon">ℹ️</span>;
    }
  };

  // Get action button text based on content type
  const getActionButtonText = () => {
    switch (currentContent.contentType) {
      case 'link':
        return 'Visit Resource';
      case 'pdf':
        return 'Download PDF';
      case 'video':
        return 'Watch Video';
      case 'tool':
        return 'Use Tool';
      case 'book':
        return 'View Book';
      case 'article':
        return 'Read Article';
      case 'podcast':
        return 'Listen to Podcast';
      case 'tweet':
        return 'View Tweet';
      default:
        return 'Visit Resource';
    }
  };

  // Render HTML content safely
  const renderHTML = (html) => {
    return { __html: html };
  };

  // Get proper URL from content object
  const url = getActionUrl();

  return (
    <div className="modal-overlay">
      <div className="modal-container" ref={modalRef}>
        <div className="modal-header">
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="content-header">
            {getContentIcon(currentContent)}
            
            <div className="content-meta">
              <h2>{currentContent.title}</h2>
              {currentContent.tagline && <p className="tagline">{currentContent.tagline}</p>}
              
              <div className="content-tags">
                {currentContent.contentType && (
                  <span className="content-type-tag">
                    {currentContent.contentType}
                  </span>
                )}
                
                {currentContent.category && (
                  <span className="category-tag">
                     {currentContent.category}
                    {currentContent.subcategory && <> &gt; {currentContent.subcategory}</>}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="content-body">
            {/* Website Preview Section */}
            {url && (
              <div className="website-preview-section">
                {previewLoading ? (
                  <div className="preview-loading">
                    <div className="preview-loading-indicator"></div>
                    <p>Loading preview...</p>
                  </div>
                ) : previewImage ? (
                  <div className="preview-image-container">
                    <img 
                      src={previewImage} 
                      alt={`Preview of ${currentContent.title}`} 
                      className={`website-preview-image ${previewImage.includes('favicon') ? 'favicon-fallback' : ''}`}
                      onError={(e) => {
                        // If preview image fails to load, try favicon as fallback
                        const domain = new URL(url).hostname;
                        e.target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                        e.target.classList.add('favicon-fallback');
                      }}
                    />
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="preview-overlay-link"
                      aria-label={`Visit ${currentContent.title}`}
                    >
                      <div className="preview-overlay">
                        <span className="preview-visit-text">{getActionButtonText()}</span>
                      </div>
                    </a>
                  </div>
                ) : (
                  // Link Preview Section when no image preview is available
                  <div className="link-preview-section">
                    {linkPreview && (
                      <div className="link-preview-header">
                        {linkPreview.favicon && (
                          <img 
                            src={linkPreview.favicon} 
                            alt="" 
                            className="link-preview-favicon" 
                          />
                        )}
                        <span className="link-preview-domain">{linkPreview.domain}</span>
                      </div>
                    )}
                    
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="resource-link"
                    >
                      <span>{getActionButtonText()}</span>
                      <span>↗️</span>
                    </a>
                  </div>
                )}
              </div>
            )}
            
            {/* When no website preview, link preview, or URL is available */}
            {!url && !previewImage && !linkPreview && (
              <div className="no-url-message">
                <div className="no-url-icon">
                  🌐
                </div>
                <p>No URL available for this resource</p>
              </div>
            )}

            <div className="main-info">
              {currentContent.description && (
                <div className="description-section">
                  {/* Special Toolkit Studio badge if applicable */}
                  {currentContent.author && 
                  (currentContent.author.toLowerCase() === 'toolkit studio' || 
                  currentContent.author.toLowerCase() === 'toolkitstudio') && (
                  <div className="author-studio-modal">
                      <div className="studio-icon">★</div>
                      <div className="studio-text">
                      This resource is created and maintained by the Toolkit Studio team
                      </div>
                      <div className="studio-tag">Official</div>
                  </div>
                  )}
                  <h3>Description</h3>
                  <p>{currentContent.description}</p>
                </div>
              )}
            </div>
            
            {currentContent.useCaseScenario && (
              <div className="detail-section">
                <h4>Use Case</h4>
                <p>{currentContent.useCaseScenario}</p>
              </div>
            )}

            {currentContent.risdTip && (
              <div className="detail-section risd-tip">
                <h4>RISD Tip</h4>
                <p>{currentContent.risdTip}</p>
              </div>
            )}

            <div className="details-grid">
              {currentContent.pros && (
                <div className="detail-section pros">
                  <h4>Pros</h4>
                  <div dangerouslySetInnerHTML={renderHTML(currentContent.pros)} />
                </div>
              )}

              {currentContent.cons && (
                <div className="detail-section cons">
                  <h4>Cons</h4>
                  <div dangerouslySetInnerHTML={renderHTML(currentContent.cons)} />
                </div>
              )}
            </div>

            <div className="content-footer">
              {currentContent.submittedBy && (
                <div className="submitted-by">
                  <span>Submitted by: {currentContent.submittedBy}</span>
                </div>
              )}

              {currentContent.date && (
                <div className="date-info">
                  <span>Added: {currentContent.date}</span>
                </div>
              )}
            </div>
            
            {/* Related Content Section with Microlink Previews */}
            {relatedContent.length > 0 && (
              <div className="related-content">
                <h3 className="related-heading">
                  {currentContent.author ? `More from ${currentContent.author}` : 'Related Content'}
                </h3>
                
                <div className="related-grid">
                  {relatedContent.map((item) => {
                    const itemUrl = getContentUrl(item);
                    const previewImg = relatedPreviews[item.id];
                    const isFaviconFallback = previewImg && previewImg.includes('favicon');
                    
                    return (
                      <div className="related-card" key={item.id}>
                        <div className="related-card-inner">
                          {/* Use Microlink preview instead of regular image */}
                          <div className="related-image-container">
                            {previewImg ? (
                              <img 
                                src={previewImg} 
                                alt={`Preview of ${item.title}`} 
                                className={`related-image ${isFaviconFallback ? 'favicon-fallback' : ''}`}
                                onError={(e) => {
                                  if (itemUrl) {
                                    const domain = new URL(itemUrl).hostname;
                                    e.target.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                                    e.target.classList.add('favicon-fallback');
                                  }
                                }}
                              />
                            ) : item.image ? (
                              <img src={item.image} alt={item.title} className="related-image" />
                            ) : (
                              <div className="related-image-placeholder">
                                {getContentIcon(item)}
                              </div>
                            )}
                          </div>
                          
                          <div className="related-card-content">
                            <h4 className="related-title">{item.title}</h4>
                            
                            <div className="related-meta">
                              {item.contentType && (
                                <span className="related-type-badge">
                                  {item.contentType}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Make the entire card clickable to view in the modal */}
                          <button
                            className="related-overlay-link"
                            onClick={(e) => handleRelatedItemClick(item, e)}
                            aria-label={`View ${item.title}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentModal;