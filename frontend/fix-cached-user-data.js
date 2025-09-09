// This script updates the user's cached authentication data in localStorage
// Run this in the browser console to fix the school identifier issue

function fixCachedUserData() {
  try {
    // Get the current auth data from localStorage
    const authData = localStorage.getItem('erp.auth');
    
    if (!authData) {
      console.log('❌ No auth data found in localStorage');
      return;
    }
    
    const parsed = JSON.parse(authData);
    console.log('📄 Current auth data:', parsed);
    
    // Update the user data with correct school information
    if (parsed.user) {
      parsed.user.schoolId = '68ab3c2d9b75ee103940cc43';
      parsed.user.schoolCode = 'P';
      parsed.user.schoolName = 'p';
      
      // Save back to localStorage
      localStorage.setItem('erp.auth', JSON.stringify(parsed));
      
      console.log('✅ Updated auth data:', parsed);
      console.log('🔄 Please refresh the page to apply changes');
      
      return parsed;
    } else {
      console.log('❌ No user data found in auth object');
    }
    
  } catch (error) {
    console.error('❌ Error updating cached user data:', error);
  }
}

// Run the fix
fixCachedUserData();
