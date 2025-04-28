// src/components/LinkPost.jsx

import React from 'react';
import './BlogStyles.css'; // Reusing the same styles for consistency

const LinkPost = ({ post }) => {
  // Function to render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  if (!post) return null;

  return (
    <div className="link-view-content">
      <div className="mdn-container">
        {/* Main content area */}
        <div className="mdn-main-content">
          {/* Article header */}
          <header className="mdn-article-header">
            <h1 className="mdn-title">{post.title}</h1>
            
            <div className="mdn-article-metadata">
              {post.author && <span className="mdn-author">Added by {post.author}</span>}
              {post.date && <span className="mdn-date">{post.date}</span>}
              {post.category && (
                <span className="mdn-category">
                  Category: <span className="mdn-category-tag">{post.category}</span>
                </span>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="mdn-tags">
                  {post.tags.split(',').map((tag, index) => (
                    <span key={index} className="mdn-tag">{tag.trim()}</span>
                  ))}
                </div>
              )}
              {post.organization && (
                <span className="mdn-organization">
                  Organization: <span className="mdn-org-name">{post.organization}</span>
                </span>
              )}
            </div>
            
            {/* Link summary section */}
            {post.description && (
              <div className="mdn-summary">
                <h2>Description</h2>
                <p>{post.description}</p>
              </div>
            )}
          </header>
          
          {/* Main link content with restructured sections */}
          <article className="mdn-content">
            <div className="mdn-link-container">
              <a 
                href={post.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mdn-link-button"
              >
                {post.favicon && (
                  <img 
                    src={post.favicon} 
                    alt="" 
                    className="mdn-link-favicon" 
                  />
                )}
                <span>Visit Website</span>
              </a>
              
              {/* New Function section */}
              {post.function && (
                <div className="mdn-section mdn-function-section">
                  <h3>Function of Site</h3>
                  <div dangerouslySetInnerHTML={createMarkup(post.function)} />
                </div>
              )}
              
              {/* New Pros section */}
              {post.pros && (
                <div className="mdn-section mdn-pros-section">
                  <h3>Pros</h3>
                  <div dangerouslySetInnerHTML={createMarkup(post.pros)} />
                </div>
              )}
              
              {/* New Cons section */}
              {post.cons && (
                <div className="mdn-section mdn-cons-section">
                  <h3>Cons</h3>
                  <div dangerouslySetInnerHTML={createMarkup(post.cons)} />
                </div>
              )}
              
              {/* Original Notes section, maintained for backward compatibility */}
              {post.notes && (
                <div className="mdn-section mdn-link-notes">
                  <h3>Additional Notes</h3>
                  <div dangerouslySetInnerHTML={createMarkup(post.notes)} />
                </div>
              )}
            </div>
          </article>
        </div>
        
        {/* Sidebar with metadata and related content */}
        <div className="mdn-sidebar">
          {/* Metadata card */}
          <div className="mdn-sidebar-card">
            <h3>Link Information</h3>
            <dl className="mdn-metadata-list">
              <dt>Added on:</dt>
              <dd>{post.date}</dd>
              
              {post.organization && (
                <>
                  <dt>Organization:</dt>
                  <dd>{post.organization}</dd>
                </>
              )}
              
              {post.rating && (
                <>
                  <dt>Rating:</dt>
                  <dd>{post.rating} / 5</dd>
                </>
              )}
              
              {/* Add usage level if available */}
              {post.usageLevel && (
                <>
                  <dt>Usage Level:</dt>
                  <dd>{post.usageLevel}</dd>
                </>
              )}
              
              {/* Add learning curve if available */}
              {post.learningCurve && (
                <>
                  <dt>Learning Curve:</dt>
                  <dd>{post.learningCurve}</dd>
                </>
              )}
            </dl>
          </div>
          
          {/* Related resources */}
          {post.relatedResources && post.relatedResources.length > 0 && (
            <div className="mdn-sidebar-card">
              <h3>Related Resources</h3>
              <ul className="mdn-related-list">
                {post.relatedResources.map((resource, index) => (
                  <li key={index}>
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      {resource.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Page footer */}
        <footer className="mdn-footer">
          <div className="mdn-feedback">
            <h2>Tags</h2>
            {post.tags && post.tags.length > 0 && (
              <div className="mdn-footer-tags">
                <strong>Tags:</strong>
                {post.tags.split(',').map((tag, index) => (
                  <span key={index} className="mdn-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LinkPost;