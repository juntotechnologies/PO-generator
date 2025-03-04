/**
 * PO Generator - Test Suite
 * 
 * This file contains unit and integration tests for the PO Generator application
 * To run these tests, open the browser console and call runAllTests()
 */

// Test suite container
const tests = {
  // Unit tests
  unit: {
    // Test updatePreview function
    testUpdatePreview: function() {
      console.log('UNIT TEST: Testing updatePreview function');
      
      // Setup test data
      document.getElementById('vendorName').value = 'Test Vendor';
      document.getElementById('vendorAddress').value = '123 Test St';
      document.getElementById('vendorCity').value = 'Test City';
      document.getElementById('vendorState').value = 'TS';
      document.getElementById('vendorZip').value = '12345';
      document.getElementById('vendorCountry').value = 'USA';
      
      // Call the function
      updatePreview();
      
      // Check if the preview was updated correctly
      const vendorNameInPreview = document.getElementById('po-preview')
        .querySelector('.row:nth-child(2) .col-6:nth-child(1) p').textContent;
      
      // Assert
      if (vendorNameInPreview.includes('Test Vendor')) {
        console.log('✅ PASSED: Preview correctly displays vendor name');
        return true;
      } else {
        console.error('❌ FAILED: Preview did not update with vendor name');
        console.log('Expected to find "Test Vendor", got:', vendorNameInPreview);
        return false;
      }
    },
    
    // Test preparePrintPreview function
    testPreparePrintPreview: function() {
      console.log('UNIT TEST: Testing preparePrintPreview function');
      
      // Get initial state
      const previewContainer = document.getElementById('po-preview');
      const initialBoxShadow = previewContainer.style.boxShadow;
      
      // Call the function
      preparePrintPreview();
      
      // Check immediate effects
      const boxShadowAfterCall = previewContainer.style.boxShadow;
      
      // Give time for the timeout to complete
      return new Promise((resolve) => {
        setTimeout(() => {
          // Check if shadow was reset
          const boxShadowAfterTimeout = previewContainer.style.boxShadow;
          
          // Assert
          if (boxShadowAfterCall !== initialBoxShadow && boxShadowAfterTimeout === '') {
            console.log('✅ PASSED: Preview highlight effect works correctly');
            resolve(true);
          } else {
            console.error('❌ FAILED: Preview highlight effect did not work as expected');
            console.log('Initial:', initialBoxShadow);
            console.log('After call:', boxShadowAfterCall);
            console.log('After timeout:', boxShadowAfterTimeout);
            resolve(false);
          }
        }, 1100); // Just after the 1s timeout in the function
      });
    }
  },
  
  // Integration tests
  integration: {
    // Test the entire preview flow
    testPreviewButtonFlow: function() {
      console.log('INTEGRATION TEST: Testing See Preview button flow');
      
      // Setup - find the button
      const previewBtn = document.getElementById('printPreviewBtn');
      if (!previewBtn) {
        console.error('❌ FAILED: Could not find preview button');
        return false;
      }
      
      // Get initial state of preview container
      const previewContainer = document.getElementById('po-preview');
      const initialDisplayState = window.getComputedStyle(previewContainer).display;
      
      // Click the button
      console.log('Clicking the "See Preview" button');
      previewBtn.click();
      
      // Check if preview is visible
      const afterClickDisplayState = window.getComputedStyle(previewContainer).display;
      
      // Assert
      if (afterClickDisplayState === 'block' && afterClickDisplayState !== 'none') {
        console.log('✅ PASSED: Preview is displayed after clicking the button');
        return true;
      } else {
        console.error('❌ FAILED: Preview is not displayed properly after clicking the button');
        console.log('Initial display:', initialDisplayState);
        console.log('After click display:', afterClickDisplayState);
        return false;
      }
    },
    
    // Test form input to preview rendering
    testFormToPreviewRendering: function() {
      console.log('INTEGRATION TEST: Testing form input to preview rendering');
      
      // Setup test data with unique identifiers
      const testVendor = 'Test Vendor ' + Date.now();
      const testActivity = 'Activity ' + Date.now();
      
      // Fill form fields
      document.getElementById('vendorName').value = testVendor;
      document.getElementById('activityDescription').value = testActivity;
      
      // Click preview button
      document.getElementById('printPreviewBtn').click();
      
      // Check if preview shows the data
      const previewText = document.getElementById('po-preview').textContent;
      
      // Assert
      if (previewText.includes(testVendor) && previewText.includes(testActivity)) {
        console.log('✅ PASSED: Preview correctly renders form input data');
        return true;
      } else {
        console.error('❌ FAILED: Preview does not correctly render form input data');
        console.log('Expected to find:', testVendor, 'and', testActivity);
        console.log('Preview text includes vendor:', previewText.includes(testVendor));
        console.log('Preview text includes activity:', previewText.includes(testActivity));
        return false;
      }
    }
  }
};

// Function to run all tests
async function runAllTests() {
  console.log('=== Starting PO Generator Test Suite ===');
  let passedTests = 0;
  let totalTests = 0;
  
  // Run unit tests
  console.log('\n--- Running Unit Tests ---');
  for (const testName in tests.unit) {
    if (typeof tests.unit[testName] === 'function') {
      totalTests++;
      try {
        const result = await tests.unit[testName]();
        if (result) passedTests++;
      } catch (error) {
        console.error(`❌ ERROR in ${testName}:`, error);
      }
    }
  }
  
  // Run integration tests
  console.log('\n--- Running Integration Tests ---');
  for (const testName in tests.integration) {
    if (typeof tests.integration[testName] === 'function') {
      totalTests++;
      try {
        const result = await tests.integration[testName]();
        if (result) passedTests++;
      } catch (error) {
        console.error(`❌ ERROR in ${testName}:`, error);
      }
    }
  }
  
  // Print summary
  console.log(`\n=== Test Summary: ${passedTests}/${totalTests} tests passed ===`);
  return passedTests === totalTests;
}

// Expose test runner to global scope
window.runAllTests = runAllTests;

// Log message about how to run tests
console.log('PO Generator tests loaded. Run tests by typing runAllTests() in the console.'); 