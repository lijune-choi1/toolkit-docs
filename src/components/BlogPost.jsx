// src/components/BlogPost.jsx

import React from 'react';
import './BlogStyles.css';

const BlogPost = ({ post }) => {
  // Function to render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  if (!post) return null;

  return (
    <div className="blog-view-content">
      <div className="mdn-container">
        {/* Main content area */}
        <div className="mdn-main-content">
          {/* Article header */}
          <header className="mdn-article-header">
            <h1 className="mdn-title">{post.title}</h1>
            
            <div className="mdn-article-metadata">
              <span className="mdn-author">By {post.author}</span>
              <span className="mdn-date">{post.date}</span>
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
            </div>
            
            {/* Article summary section */}
            {post.summary && (
              <div className="mdn-summary">
                <h2>Summary</h2>
                <p>{post.summary}</p>
              </div>
            )}
          </header>
          
          {/* Table of contents - generated if sections are available */}
          {post.sections && (
            <nav className="mdn-toc">
              <h2>In this article</h2>
              <ol>
                {post.sections.split(',').map((section, index) => (
                  <li key={index}>
                    <a href={`#section-${index+1}`}>{section.trim()}</a>
                  </li>
                ))}
              </ol>
            </nav>
          )}
          
          {/* Featured image if available */}
          {post.image && (
            <div className="mdn-feature-img">
              <img src={post.image} alt={post.title} />
              {post.imageCaption && <figcaption>{post.imageCaption}</figcaption>}
            </div>
          )}
          
          {/* Main article content */}
          <article className="mdn-content">
            <div 
              className="mdn-body"
              dangerouslySetInnerHTML={createMarkup(post.body)}
            />
          </article>
          
          {/* Specifications section if available */}
          {post.specifications && (
            <section className="mdn-specifications">
              <h2>Specifications</h2>
              <div dangerouslySetInnerHTML={createMarkup(post.specifications)} />
            </section>
          )}
          
          {/* Browser compatibility section if available */}
          {post.compatibility && (
            <section className="mdn-compatibility">
              <h2>Browser compatibility</h2>
              <div dangerouslySetInnerHTML={createMarkup(post.compatibility)} />
            </section>
          )}
          
          {/* See also section if available */}
          {post.seeAlso && (
            <section className="mdn-see-also">
              <h2>See also</h2>
              <div dangerouslySetInnerHTML={createMarkup(post.seeAlso)} />
            </section>
          )}
        </div>
        
        {/* Sidebar with metadata and related content */}
        <div className="mdn-sidebar">
          {/* Metadata card */}
          <div className="mdn-sidebar-card">
            <h3>Document Information</h3>
            <dl className="mdn-metadata-list">
              <dt>Last updated:</dt>
              <dd>{post.lastUpdated || post.date}</dd>
              
              <dt>Contributors:</dt>
              <dd>{post.contributors || post.author}</dd>
              
              {post.level && (
                <>
                  <dt>Skill level:</dt>
                  <dd>{post.level}</dd>
                </>
              )}
              
              {post.requires && (
                <>
                  <dt>Requires:</dt>
                  <dd>{post.requires}</dd>
                </>
              )}
            </dl>
          </div>
          
          {/* Related content if available */}
          {post.related && (
            <div className="mdn-sidebar-card">
              <h3>Related Topics</h3>
              <div dangerouslySetInnerHTML={createMarkup(post.related)} />
            </div>
          )}
          
          {/* Resources if available */}
          {post.resources && (
            <div className="mdn-sidebar-card">
              <h3>Resources</h3>
              <div dangerouslySetInnerHTML={createMarkup(post.resources)} />
            </div>
          )}
        </div>
        
        {/* Page footer with feedback and edit options */}
        <footer className="mdn-footer">
          <div className="mdn-feedback">
            <h2>Document Tags and Contributors</h2>
            {post.tags && post.tags.length > 0 && (
              <div className="mdn-footer-tags">
                <strong>Tags:</strong>
                {post.tags.split(',').map((tag, index) => (
                  <span key={index} className="mdn-tag">{tag.trim()}</span>
                ))}
              </div>
            )}
            <div className="mdn-footer-contributors">
              <strong>Contributors to this page:</strong>
              <span>{post.contributors || post.author}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BlogPost;