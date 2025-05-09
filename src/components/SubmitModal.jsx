// src/components/SubmitModal.jsx - Updated with Google Sheets categories
import React, { useState, useEffect } from 'react';
import './SubmitModal.css';
import { getCategories } from '../googleSheetService';

const SubmitModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    author: '',
    email: '',
    description: '',
    category: '',
    subcategory: '',
    contentType: '',
    tags: ''
  });
  
  const [categories, setCategories] = useState([]);
  const [contentTypes, setContentTypes] = useState([
    'link', 'video', 'tool', 'book', 'article', 'podcast', 'tweet', 'pdf'
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch categories from Google Sheets
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const categoryList = await getCategories();
        setCategories(categoryList);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.url || !formData.url.startsWith('http')) {
      setError('Please enter a valid URL');
      return;
    }

    if (!formData.title) {
      setError('Please enter a title for the resource');
      return;
    }

    if (!formData.author) {
      setError('Please enter your name');
      return;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        submittedBy: formData.author // Set submittedBy to match author
      };
      
      // Call the onSubmit function which will handle the submission to Google Sheets
      await onSubmit(submissionData);
      
      // Reset form and show success message
      setFormData({
        title: '',
        url: '',
        author: '',
        email: '',
        description: '',
        category: '',
        subcategory: '',
        contentType: '',
        tags: ''
      });
      
      setSuccess(true);
      
      // Automatically close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('There was an error submitting your resource. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Determine subcategories based on selected category
  const getSubcategories = (selectedCategory) => {
    // This is a simplified approach. In a real app, you'd get subcategories from your data
    switch (selectedCategory) {
      case 'Design':
        return ['Graphic Design', 'UI/UX', 'Typography', 'Illustration', 'Branding'];
      case 'Job Search':
        return ['Resumes', 'Portfolios', 'Interviews', 'Networking', 'Job Boards'];
      case 'Navigating School':
        return ['Study Resources', 'Campus Life', 'Financial Aid', 'Academic Planning'];
      case 'Resources':
        return ['Free Tools', 'Templates', 'Learning', 'Reference'];
      default:
        return [];
    }
  };

  const subcategories = formData.category ? getSubcategories(formData.category) : [];

  return (
    <div className="modal-overlay">
      <div className="submit-modal">
        <div className="modal-header">
          <h2>Submit a Resource</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-content2">
          <p className="modal-description">
            Send us a resource you'd like to share with the community. We'll review it and add it to the toolkit if it's a good fit.
          </p>
          
          {loading ? (
            <div className="loading-message">
              <p>Loading categories...</p>
            </div>
          ) : success ? (
            <div className="success-message">
              <p>Thanks for your submission! We'll review it soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="title">Resource Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Title of the resource"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="url">URL</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contentType">Resource Type</label>
                <select
                  id="contentType"
                  name="contentType"
                  value={formData.contentType}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select content type</option>
                  {contentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.category && subcategories.length > 0 && (
                <div className="form-group">
                  <label htmlFor="subcategory">Subcategory</label>
                  <select
                    id="subcategory"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleChange}
                    className="form-select"
                  >
                    <option value="">Select a subcategory (optional)</option>
                    {subcategories.map(subcat => (
                      <option key={subcat} value={subcat}>
                        {subcat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Briefly describe this resource"
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="Tags (comma separated, optional)"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="author">Your Name</label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  className="form-input"
                />
              </div>
              
              <p className="submission-notice">
                We'll credit you as the contributor when we publish this resource
              </p>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Resource'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;