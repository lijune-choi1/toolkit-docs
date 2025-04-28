// src/services/submissionService.js

/**
 * This service handles sending the submitted links to Google Sheets or via email.
 * You'll need to set up a Google Sheets API integration or use a service like 
 * Zapier, Integromat, or a simple backend API to handle the actual submission.
 */

// Option 1: Using a server-less approach with Google Apps Script
// Create a Google Sheet and deploy a web app with Google Apps Script
// that accepts POST requests and adds them to your spreadsheet

/**
 * Submits a link to your Google Sheet using Google Apps Script web app
 * @param {Object} formData - The form data to submit
 * @returns {Promise} - A promise that resolves when the submission is complete
 */
export const submitToGoogleSheet = async (formData) => {
    // Replace with your Google Apps Script web app URL
    const scriptUrl = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxmUC79wq_A_eHCoocrCT7Q6jl-DRP_jviLs56iju8-52LxhQWatcSp5rxwQBtXZW5x/exec';
    
    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
        }),
      });
      
      return true; // With no-cors, we can't check the response, so assume success
    } catch (error) {
      console.error('Error submitting to Google Sheet:', error);
      throw error;
    }
  };
  
  // Option 2: Using a form submission service like Formspree or FormSubmit
  export const submitViaFormService = async (formData) => {
    // Replace with your form service endpoint
    const formEndpoint = process.env.REACT_APP_FORM_ENDPOINT || 'YOUR_FORM_SUBMISSION_URL';
    
    try {
      const response = await fetch(formEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          _subject: `New website submission: ${formData.url}`,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Form submission failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    }
  };
  
  // Option 3: Send form data to your own backend API
  export const submitToBackendAPI = async (formData) => {
    // Replace with your backend API endpoint
    const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || '/api/submit';
    
    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error(`API submission failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting to API:', error);
      throw error;
    }
  };
  
  /**
   * Main submission function that you'll call from your component
   * Choose the implementation that works best for your setup
   */
  export const submitForm = async (formData) => {
    // Choose one of the implementation methods:
    
    // For Google Sheets:
    return await submitToGoogleSheet(formData);
    
    // For form submission services:
    // return await submitViaFormService(formData);
    
    // For your own backend API:
    // return await submitToBackendAPI(formData);
  };