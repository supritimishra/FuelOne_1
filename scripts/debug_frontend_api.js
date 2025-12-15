// Test script to debug API calls from frontend
console.log('Testing API call from frontend...');

// Test without authentication headers first
fetch('/api/tanker-sales')
  .then(response => {
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);
    console.log('Data type:', typeof data);
    console.log('Has value property:', 'value' in data);
    if (data.value) {
      console.log('Value length:', data.value.length);
      console.log('First item:', data.value[0]);
    }
  })
  .catch(error => {
    console.error('API Error:', error);
  });
