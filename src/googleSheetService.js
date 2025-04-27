// src/googleSheetService.js - Updated to support multiple sheets

import Papa from 'papaparse';

// Define URLs for each sheet (replace these with your actual published sheet URLs)
const SHEET_URLS = {
  blogs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7s-KEJOG_ui2rqMxpOF6KwgzTCjEeXdL4_cNLx4oXelGbWNhu9aCCYcu68qEJygVGsiI08TnvDXCQ/pub?gid=0&single=true&output=csv',
  links: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7s-KEJOG_ui2rqMxpOF6KwgzTCjEeXdL4_cNLx4oXelGbWNhu9aCCYcu68qEJygVGsiI08TnvDXCQ/pub?gid=680497028&single=true&output=csv',
  pdfs: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7s-KEJOG_ui2rqMxpOF6KwgzTCjEeXdL4_cNLx4oXelGbWNhu9aCCYcu68qEJygVGsiI08TnvDXCQ/pub?gid=401906266&single=true&output=csv'
};

// Disable caching
const CACHE_DURATION = 0; 

// Cache mechanism (separate caches for each content type)
const cache = {
  blogs: { data: null, timestamp: null },
  links: { data: null, timestamp: null },
  pdfs: { data: null, timestamp: null },
};

/**
 * Generic function to fetch and parse data from any sheet
 * @param {string} sheetType - Which sheet to fetch (blogs, links, pdfs)
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Array>} - Array of objects from the sheet
 */
const fetchSheetData = async (sheetType, forceRefresh = true) => {
  if (!SHEET_URLS[sheetType]) {
    throw new Error(`Unknown sheet type: ${sheetType}`);
  }
  
  // Use cache if available and not forcing refresh
  if (!forceRefresh && 
      cache[sheetType].data && 
      cache[sheetType].timestamp && 
      (Date.now() - cache[sheetType].timestamp < CACHE_DURATION)) {
    console.log(`Using cached ${sheetType} data`);
    return cache[sheetType].data;
  }
  
  // Add cache buster to URL
  const cacheBuster = `&_cb=${Date.now()}`;
  const url = `${SHEET_URLS[sheetType]}${SHEET_URLS[sheetType].includes('?') ? '&' : '?'}_cb=${cacheBuster}`;
  
  console.log(`Fetching ${sheetType} data from ${url}`);
  
  try {
    // Fetch with cache-busting headers
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheetType} data: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    console.log(`Received ${sheetType} CSV data (first 100 chars):`, csvData.substring(0, 100));
    
    // Parse CSV
    const { data, errors, meta } = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (errors.length > 0) {
      console.warn(`CSV parsing errors for ${sheetType}:`, errors);
    }
    
    console.log(`${sheetType} CSV headers:`, meta.fields);
    console.log(`Parsed ${sheetType} data rows:`, data.length);
    
    // Update cache
    cache[sheetType].data = data;
    cache[sheetType].timestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error(`Error fetching ${sheetType} data:`, error);
    
    // Return cached data as fallback if available
    if (cache[sheetType].data) {
      console.log(`Returning cached ${sheetType} data as fallback`);
      return cache[sheetType].data;
    }
    
    return [];
  }
};

/**
 * Transform raw blog data into structured blog posts
 * @param {Array} data - Raw data from the blogs sheet
 * @returns {Array} - Structured blog posts
 */
const transformBlogData = (data) => {
  return data.map(row => {
    // Make sure Category is properly handled
    const category = (row.Category || '').trim() || 'Uncategorized';
    const subcategory = (row.Subcategory || '').trim() || '';
    
    // Construct path
    let path;
    if (subcategory) {
      path = `/${category}/${subcategory}/${row.Title || 'Untitled Post'}.post`;
    } else {
      path = `/${category}/${row.Title || 'Untitled Post'}.post`;
    }
    
    return {
      id: row.ID ? row.ID.toString() : Date.now().toString(),
      title: row.Title || 'Untitled Post',
      author: row.Author || 'Unknown Author',
      date: row.Date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      category: category,
      subcategory: subcategory,
      body: row.Body || '<p>No content available</p>',
      path: path,
      contentType: 'blog',
      
      // Extended MDN-style fields
      tags: row.Tags || '',
      summary: row.Summary || '',
      sections: row.Sections || '',
      image: row.Image || '/api/placeholder/800/400',
      imageCaption: row.ImageCaption || '',
      lastUpdated: row.LastUpdated || row.Date || new Date().toLocaleDateString('en-US'),
      contributors: row.Contributors || row.Author || 'Unknown Author',
      level: row.Level || '',
      requires: row.Requires || '',
      specifications: row.Specifications || '',
      compatibility: row.Compatibility || '',
      seeAlso: row.SeeAlso || '',
      related: row.Related || '',
      resources: row.Resources || ''
    };
  });
};

/**
 * Transform raw link data into structured link objects
 * @param {Array} data - Raw data from the links sheet
 * @returns {Array} - Structured link objects
 */
const transformLinkData = (data) => {
  return data.map(row => {
    const category = (row.Category || '').trim() || 'Uncategorized';
    const subcategory = (row.Subcategory || '').trim() || '';
    
    let path;
    if (subcategory) {
      path = `/${category}/${subcategory}/${row.Title || 'Untitled Link'}.link`;
    } else {
      path = `/${category}/${row.Title || 'Untitled Link'}.link`;
    }
    
    return {
      id: row.ID ? row.ID.toString() : Date.now().toString(),
      title: row.Title || 'Untitled Link',
      url: row.URL || '',
      description: row.Description || '',
      category: category,
      subcategory: subcategory,
      tags: row.Tags || '',
      date: row.Date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      author: row.Author || 'Unknown',
      path: path,
      contentType: 'link',
      
      // Additional fields specific to links
      favicon: row.Favicon || '',
      organization: row.Organization || '',
      rating: row.Rating || null,
      notes: row.Notes || ''
    };
  });
};

/**
 * Transform raw PDF data into structured PDF objects
 * @param {Array} data - Raw data from the PDFs sheet
 * @returns {Array} - Structured PDF objects
 */
const transformPDFData = (data) => {
  return data.map(row => {
    const category = (row.Category || '').trim() || 'Uncategorized';
    const subcategory = (row.Subcategory || '').trim() || '';
    
    let path;
    if (subcategory) {
      path = `/${category}/${subcategory}/${row.Title || 'Untitled PDF'}.pdf`;
    } else {
      path = `/${category}/${row.Title || 'Untitled PDF'}.pdf`;
    }
    
    return {
      id: row.ID ? row.ID.toString() : Date.now().toString(),
      title: row.Title || 'Untitled PDF',
      fileUrl: row.FileURL || '',
      description: row.Description || '',
      category: category,
      subcategory: subcategory,
      tags: row.Tags || '',
      date: row.Date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      author: row.Author || 'Unknown',
      path: path,
      contentType: 'pdf',
      
      // Additional fields specific to PDFs
      fileSize: row.FileSize || 'Unknown',
      pageCount: row.PageCount || null,
      thumbnailUrl: row.ThumbnailURL || '',
      summary: row.Summary || ''
    };
  });
};

/**
 * Fetch and transform blog posts
 */
export const fetchBlogPosts = async (forceRefresh = true) => {
  const rawData = await fetchSheetData('blogs', forceRefresh);
  return transformBlogData(rawData);
};

/**
 * Fetch and transform links
 */
export const fetchLinks = async (forceRefresh = true) => {
  const rawData = await fetchSheetData('links', forceRefresh);
  return transformLinkData(rawData);
};

/**
 * Fetch and transform PDFs
 */
export const fetchPDFs = async (forceRefresh = true) => {
  const rawData = await fetchSheetData('pdfs', forceRefresh);
  return transformPDFData(rawData);
};

/**
 * Fetch all content types and merge them
 */
export const fetchAllContent = async (forceRefresh = true) => {
  const [blogs, links, pdfs] = await Promise.all([
    fetchBlogPosts(forceRefresh),
    fetchLinks(forceRefresh),
    fetchPDFs(forceRefresh)
  ]);
  
  return [...blogs, ...links, ...pdfs];
};

/**
 * Get unique categories across all content types
 */
export const getCategories = async (forceRefresh = true) => {
  const allContent = await fetchAllContent(forceRefresh);
  
  const categories = [...new Set(allContent
    .map(item => item.category)
    .filter(category => category && typeof category === 'string' && category.trim() !== '')
  )].sort();
  
  console.log('Extracted categories:', categories);
  return categories;
};

/**
 * Get all unique subcategories for a specific category
 */
export const getSubcategories = async (category, forceRefresh = true) => {
  const allContent = await fetchAllContent(forceRefresh);
  
  const subcategories = [...new Set(allContent
    .filter(item => item.category === category && item.subcategory)
    .map(item => item.subcategory)
    .filter(subcategory => subcategory && typeof subcategory === 'string' && subcategory.trim() !== '')
  )].sort();
  
  console.log(`Extracted subcategories for ${category}:`, subcategories);
  return subcategories;
};

/**
 * Gets a hierarchical structure of categories and subcategories
 */
export const getCategoryHierarchy = async (forceRefresh = true) => {
  const allContent = await fetchAllContent(forceRefresh);
  
  // Create a map to store hierarchical structure
  const hierarchy = {};
  
  // Process each item to build the hierarchy
  allContent.forEach(item => {
    const category = item.category;
    const subcategory = item.subcategory;
    const contentType = item.contentType;
    
    // Create category if it doesn't exist
    if (!hierarchy[category]) {
      hierarchy[category] = {
        name: category,
        subcategories: {},
        contentTypes: new Set()
      };
    }
    
    // Add content type to the category
    hierarchy[category].contentTypes.add(contentType);
    
    // Add subcategory if it exists
    if (subcategory) {
      if (!hierarchy[category].subcategories[subcategory]) {
        hierarchy[category].subcategories[subcategory] = {
          name: subcategory,
          parentCategory: category,
          contentTypes: new Set()
        };
      }
      hierarchy[category].subcategories[subcategory].contentTypes.add(contentType);
    }
  });
  
  // Convert Sets to Arrays for easier handling
  Object.keys(hierarchy).forEach(catKey => {
    hierarchy[catKey].contentTypes = [...hierarchy[catKey].contentTypes];
    
    Object.keys(hierarchy[catKey].subcategories).forEach(subKey => {
      hierarchy[catKey].subcategories[subKey].contentTypes = 
        [...hierarchy[catKey].subcategories[subKey].contentTypes];
    });
  });
  
  console.log('Category hierarchy:', hierarchy);
  return hierarchy;
};

/**
 * Clear all caches
 */
export const clearCache = () => {
  for (const key in cache) {
    cache[key].data = null;
    cache[key].timestamp = null;
  }
  console.log('All caches cleared');
};