const fetch = require('node-fetch');

async function testClassSubjectsEndpoint() {
  try {
    const className = 'LKG';
    const token = 'YOUR_TOKEN_HERE'; // Replace with an actual token if you have one
    
    console.log(`Testing class subjects endpoint for class: ${className}`);
    
    const response = await fetch(`http://localhost:5000/api/class-subjects/class/${encodeURIComponent(className)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

// Also test the simple test endpoint
async function testSimpleEndpoint() {
  try {
    console.log('Testing simple test endpoint');
    
    const response = await fetch('http://localhost:5000/api/test-endpoint', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('Error response:', errorText);
    }
  } catch (error) {
    console.error('Error making request:', error);
  }
}

// Run the tests
async function runTests() {
  console.log('=== Testing endpoints ===');
  
  console.log('\n1. Testing simple test endpoint:');
  await testSimpleEndpoint();
  
  console.log('\n2. Testing class subjects endpoint:');
  await testClassSubjectsEndpoint();
  
  console.log('\n=== Tests completed ===');
}

runTests();
