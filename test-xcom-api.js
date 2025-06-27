// Simple test of the X.com Twitter API client
const fetch = require('node-fetch');

async function testXcomRetrieval() {
  console.log("Testing X.com data retrieval...");
  
  // Test the improved Twitter data retrieval directly
  const testUrl = 'http://localhost:3000/api/retrieveData';
  
  try {
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'twitter',
        query: '@BrianOt61224764'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testXcomRetrieval();
