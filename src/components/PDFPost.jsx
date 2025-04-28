// src/components/PDFPost.jsx

import React from 'react';
import './BlogStyles.css'; // Reusing the same styles for consistency

const PDFPost = ({ post }) => {
  // Function to render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  if (!post) return null;

  return (
    <div className="pdf-view-content">
      <div className="mdn-container">
        {/* Main content area */}
        <div className="mdn-main-content">
          {/* Article header */}
          <header className="mdn-article-header">
            <h1 className="mdn-title">{post.title}</h1>
            
            <div className="mdn-article-metadata">
              {post.author && <span className="mdn-author">By {post.author}</span>}
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
              {post.fileSize && (
                <span className="mdn-file-size">
                  Size: <span className="mdn-size-value">{post.fileSize}</span>
                </span>
              )}
            </div>
            
            {/* PDF summary section */}
            {post.summary && (
              <div className="mdn-summary">
                <h2>Summary</h2>
                <p>{post.summary}</p>
              </div>
            )}
          </header>
          
          {/* PDF preview or thumbnail */}
          <div className="mdn-pdf-container">
            {post.thumbnailUrl ? (
              <div className="mdn-pdf-preview">
                <img 
                  src={post.thumbnailUrl} 
                  alt={`Preview of ${post.title}`} 
                  className="mdn-pdf-thumbnail" 
                />
              </div>
            ) : (
              <div className="mdn-pdf-placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <line x1="10" y1="9" x2="8" y2="9" />
                </svg>
                <span>PDF Preview Not Available</span>
              </div>
            )}
            
            {/* Download button */}
            <a 
              href={post.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="mdn-pdf-download-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Download PDF</span>
            </a>
          </div>
          
          {/* Description if available */}
          {post.description && (
            <article className="mdn-content">
              <h2>Description</h2>
              <div 
                className="mdn-body"
                dangerouslySetInnerHTML={createMarkup(post.description)}
              />
            </article>
          )}
        </div>
        
        {/* Sidebar with metadata */}
        <div className="mdn-sidebar">
          {/* Metadata card */}
          <div className="mdn-sidebar-card">
            <h3>Document Information</h3>
            <dl className="mdn-metadata-list">
              <dt>Added on:</dt>
              <dd>{post.date}</dd>
              
              {post.author && (
                <>
                  <dt>Author:</dt>
                  <dd>{post.author}</dd>
                </>
              )}
              
              {post.fileSize && (
                <>
                  <dt>File size:</dt>
                  <dd>{post.fileSize}</dd>
                </>
              )}
              
              {post.pageCount && (
                <>
                  <dt>Pages:</dt>
                  <dd>{post.pageCount}</dd>
                </>
              )}
            </dl>
          </div>
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

export default PDFPost;