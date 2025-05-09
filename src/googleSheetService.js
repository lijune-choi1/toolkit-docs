// src/googleSheetService.js - Updated to support all content types with link handling

import Papa from 'papaparse';

// Define URL for the single sheet (replace with your actual published sheet URL)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT7s-KEJOG_ui2rqMxpOF6KwgzTCjEeXdL4_cNLx4oXelGbWNhu9aCCYcu68qEJygVGsiI08TnvDXCQ/pub?gid=0&single=true&output=csv';

// Disable caching
const CACHE_DURATION = 0; 

// Cache mechanism
const cache = {
  data: null,
  timestamp: null,
};

/**
 * Function to fetch and parse data from the sheet
 * @param {boolean} forceRefresh - Whether to bypass cache
 * @returns {Promise<Array>} - Array of objects from the sheet
 */
const fetchSheetData = async (forceRefresh = true) => {
  // Use cache if available and not forcing refresh
  if (!forceRefresh && 
      cache.data && 
      cache.timestamp && 
      (Date.now() - cache.timestamp < CACHE_DURATION)) {
    console.log('Using cached data');
    return cache.data;
  }
  
  // Add cache buster to URL
  const cacheBuster = `&_cb=${Date.now()}`;
  const url = `${SHEET_URL}${SHEET_URL.includes('?') ? '&' : '?'}_cb=${cacheBuster}`;
  
  console.log(`Fetching data from ${url}`);
  
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
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    
    const csvData = await response.text();
    console.log(`Received CSV data (first 100 chars):`, csvData.substring(0, 100));
    
    // Parse CSV
    const { data, errors, meta } = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    if (errors.length > 0) {
      console.warn(`CSV parsing errors:`, errors);
    }
    
    console.log(`CSV headers:`, meta.fields);
    console.log(`Parsed data rows:`, data.length);
    
    // Update cache
    cache.data = data;
    cache.timestamp = Date.now();
    
    return data;
  } catch (error) {
    console.error(`Error fetching data:`, error);
    
    // Return cached data as fallback if available
    if (cache.data) {
      console.log(`Returning cached data as fallback`);
      return cache.data;
    }
    
    return [];
  }
};

/**
 * Transform raw data into structured content items
 * @param {Array} data - Raw data from the sheet
 * @returns {Array} - Structured content items
 */
const transformData = (data) => {
  return data.map(row => {
    // Make sure Category and ContentType are properly handled
    const category = (row.Category || '').trim() || 'Uncategorized';
    const subcategory = (row.Subcategory || '').trim() || '';
    
    // FIXED: Ensure contentType is properly normalized and not empty
    let contentType = 'Link'; // Default to Link if nothing specified
    if (row.ContentType) {
      contentType = row.ContentType.trim();
      // Capitalize first letter for consistency
      contentType = contentType.charAt(0).toUpperCase() + contentType.slice(1).toLowerCase();
    }
    
    // Construct path
    let path;
    if (subcategory) {
      path = `/${category}/${subcategory}/${row.Title || 'Untitled Item'}.${contentType.toLowerCase()}`;
    } else {
      path = `/${category}/${row.Title || 'Untitled Item'}.${contentType.toLowerCase()}`;
    }
    
    // Base properties that all content types have
    const baseItem = {
      id: row.ID ? row.ID.toString() : Date.now().toString(),
      title: row.Title || 'Untitled Item',
      tagline: row.Tagline || '',
      description: row.Description || '',
      contentType: contentType,
      category: category,
      subcategory: subcategory,
      tags: row.Tags || '',
      date: row.Date ? new Date(row.Date, 0).getFullYear() : new Date().getFullYear(),
      author: row.Author || 'Unknown',
      path: path,
      useCaseScenario: row["Use Case Scenario"] || '',
      risdTip: row["RISD Tip"] || '',
      pros: row.Pros || '',
      cons: row.Cons || '',
      platformInfo: row["Platform Info"] || '',
      submittedBy: row["Submitted By"] || '',
      image: row.Image || '/api/placeholder/400/300',
      // Add URL to base item so it's available for all content types
      url: row.URL || ''
    };
    
    // Conditional properties based on content type
    switch (contentType.toLowerCase()) {
      case 'blog':
        return {
          ...baseItem,
          body: row.Description || '<p>No content available</p>',
        };
      case 'link':
        return {
          ...baseItem,
          // url is already in baseItem
        };
      case 'pdf':
        return {
          ...baseItem,
          fileUrl: row.URL || '',
          fileSize: 'Unknown',
        };
      case 'video':
        return {
          ...baseItem,
          videoUrl: row.URL || '',
          duration: row.Duration || 'Unknown',
        };
      case 'tool':
        return {
          ...baseItem,
          toolUrl: row.URL || '',
          toolType: row.ToolType || 'General',
        };
      case 'book':
        return {
          ...baseItem,
          bookUrl: row.URL || '',
          isbn: row.ISBN || '',
          publisher: row.Publisher || '',
        };
      case 'article':
        return {
          ...baseItem,
          articleUrl: row.URL || '',
          publisher: row.Publisher || '',
          publicationDate: row.PublicationDate || '',
        };
      case 'podcast':
        return {
          ...baseItem,
          podcastUrl: row.URL || '',
          host: row.Host || '',
          episode: row.Episode || '',
          duration: row.Duration || '',
        };
      case 'tweet':
        return {
          ...baseItem,
          tweetUrl: row.URL || '',
          username: row.Username || '',
          tweetDate: row.TweetDate || '',
        };
      default:
        return baseItem;
    }
  });
};

/**
 * Fetch and transform all content
 */
export const fetchContent = async (forceRefresh = true) => {
  const rawData = await fetchSheetData(forceRefresh);
  return transformData(rawData);
};

/**
 * Get unique categories across all content
 */
export const getCategories = async (forceRefresh = true) => {
  const allContent = await fetchContent(forceRefresh);
  
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
  const allContent = await fetchContent(forceRefresh);
  
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
  const allContent = await fetchContent(forceRefresh);
  
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
 * Clear the cache
 */
export const clearCache = () => {
  cache.data = null;
  cache.timestamp = null;
  console.log('Cache cleared');
};