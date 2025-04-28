// src/components/SubmitModal.jsx
import React, { useState } from 'react';
import { X } from 'lucide-react';

const SubmitModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    url: '',
    name: '',
    email: '',
    xUsername: '',
    description: '',
    category: '',
    tags: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate URL
    if (!formData.url || !formData.url.startsWith('http')) {
      setError('Please enter a valid URL');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // Call the onSubmit function which will handle the submission to Google Sheets or email
      await onSubmit(formData);
      
      // Reset form and show success message
      setFormData({
        url: '',
        name: '',
        email: '',
        xUsername: '',
        description: '',
        category: '',
        tags: ''
      });
      
      setSuccess(true);
      
      // Automatically close after success
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError('There was an error submitting your link. Please try again.');
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="submit-modal">
        <div className="modal-header">
          <h2>Submit</h2>
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-content2">
          <p className="modal-description">
            Send us a site you like and if we like it too you'll see it 
            in the catalog soon.
          </p>
          
          
          {success ? (
            <div className="success-message">
              <p>Thanks for your submission! We'll review it soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="url" className="sr-only">URL</label>
                <div className="input-with-icon">
                  <input
                    type="url"
                    id="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="URL"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="name" className="sr-only">Your Name</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="sr-only">Your Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your Email"
                    required
                    className="form-input"
                  />
                </div>
              </div>
              
        
              
              <div className="form-group">
                <label htmlFor="description" className="sr-only">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description (optional)"
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="category" className="sr-only">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">Select a category (optional)</option>
                  <option value="Agency">Agency</option>
                  <option value="Portfolio">Portfolio</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Blog">Blog</option>
                  <option value="Art">Art</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="tags" className="sr-only">Tags</label>
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
              
              <p className="submission-notice">
                We will mention you when we publish your site
              </p>
              
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;