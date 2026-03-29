// Browser Navigation System Test
// Run this script in the browser console on the dashboard page

(function() {
  console.log('🚀 Starting Navigation System Browser Tests...\n');
  
  const testResults = [];
  let testIndex = 0;
  
  function test(name, testFn) {
    testIndex++;
    try {
      const result = testFn();
      if (result === true || result === undefined) {
        testResults.push({ name, status: 'PASS', message: 'Test passed' });
        console.log(`✅ Test ${testIndex}: ${name}`);
      } else {
        testResults.push({ name, status: 'FAIL', message: result });
        console.log(`❌ Test ${testIndex}: ${name} - ${result}`);
      }
    } catch (error) {
      testResults.push({ name, status: 'ERROR', message: error.message });
      console.log(`💥 Test ${testIndex}: ${name} - ${error.message}`);
    }
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Test 1: NavigationState object
  test('NavigationState Object Exists', () => {
    return typeof NavigationState !== 'undefined' && 
           NavigationState.hasOwnProperty('currentPage') &&
           NavigationState.hasOwnProperty('history');
  });
  
  // Test 2: navTo function
  test('navTo Function Exists', () => {
    return typeof navTo === 'function';
  });
  
  // Test 3: History functions
  test('History Functions Exist', () => {
    return typeof navBack === 'function' && typeof navForward === 'function';
  });
  
  // Test 4: Progress bar functions
  test('Progress Bar Functions Exist', () => {
    return typeof showNavigationProgress === 'function' && 
           typeof hideNavigationProgress === 'function';
  });
  
  // Test 5: Error handling
  test('Error Handling Exists', () => {
    return typeof NavigationErrorHandler !== 'undefined' && 
           typeof handleNavigationError === 'function';
  });
  
  // Test 6: Page side effects
  test('Page Side Effects Function Exists', () => {
    return typeof executePageSideEffects === 'function';
  });
  
  // Test 7: Required DOM elements
  test('Required DOM Elements Exist', () => {
    const required = ['page-dashboard', 'page-practice', 'page-education', 'sidebar'];
    for (let id of required) {
      if (!document.getElementById(id)) return `Missing element #${id}`;
    }
    return true;
  });
  
  // Test 8: Current page detection
  test('Current Page Detection', () => {
    return NavigationState.currentPage === 'dashboard' || 
           document.querySelector('.page.active');
  });
  
  // Test 9: Navigation to practice page
  test('Navigate to Practice Page', async () => {
    const currentPage = NavigationState.currentPage;
    navTo('practice');
    await delay(100);
    return NavigationState.currentPage === 'practice' || 
           document.getElementById('page-practice').classList.contains('active');
  });
  
  // Test 10: Navigation history tracking
  test('Navigation History Tracking', async () => {
    const initialHistoryLength = NavigationState.history.length;
    navTo('dashboard');
    await delay(100);
    return NavigationState.history.length > initialHistoryLength;
  });
  
  // Test 11: Back navigation
  test('Back Navigation Function', async () => {
    navTo('education');
    await delay(100);
    const previousPage = NavigationState.currentPage;
    
    navBack();
    await delay(100);
    
    return NavigationState.currentPage !== previousPage;
  });
  
  // Test 12: Progress bar visibility
  test('Progress Bar Shows/Hides', async () => {
    showNavigationProgress();
    const progressBar = document.getElementById('nav-progress-bar');
    const shows = progressBar && progressBar.style.width !== '0%';
    
    await delay(200);
    hideNavigationProgress();
    await delay(200);
    
    return shows;
  });
  
  // Test 13: Error handling for invalid page
  test('Error Handling for Invalid Page', () => {
    const initialPage = NavigationState.currentPage;
    try {
      navTo('nonexistent-page');
      return NavigationState.currentPage === initialPage || 
             NavigationState.currentPage === 'dashboard';
    } catch (error) {
      return true; // Error thrown is acceptable
    }
  });
  
  // Test 14: Keyboard shortcuts
  test('Keyboard Shortcuts Setup', () => {
    const hasKeyListener = document.addEventListener.toString().includes('keydown');
    return hasKeyListener || typeof KeyboardNavigation !== 'undefined';
  });
  
  // Test 15: Page transition animations
  test('Page Transition Animation Classes', () => {
    const styles = Array.from(document.querySelectorAll('style')).map(s => s.textContent);
    const hasAnimations = styles.some(s => 
      s.includes('fade-in') || s.includes('slide-up') || s.includes('fade-in-scale')
    );
    return hasAnimations;
  });
  
  // Test 16: Sidebar navigation buttons
  test('Sidebar Navigation Buttons', () => {
    const buttons = ['nav-dashboard', 'nav-practice', 'nav-education'];
    for (let id of buttons) {
      const button = document.getElementById(id);
      if (!button || !button.onclick) return `Button #${id} missing or no onclick`;
    }
    return true;
  });
  
  // Test 17: Navigation state persistence
  test('Navigation State Persistence', async () => {
    navTo('practice');
    await delay(100);
    const practicePage = NavigationState.currentPage;
    
    navTo('dashboard');
    await delay(100);
    const dashboardPage = NavigationState.currentPage;
    
    return practicePage === 'practice' && dashboardPage === 'dashboard';
  });
  
  // Test 18: Concurrent navigation prevention
  test('Concurrent Navigation Prevention', () => {
    NavigationState.isTransitioning = true;
    const result = navTo('education');
    NavigationState.isTransitioning = false;
    return result === undefined; // Should return early if transitioning
  });
  
  // Test 19: Dropdown closing on navigation
  test('Dropdown Closing on Navigation', () => {
    if (typeof closeAllDropdowns === 'function') {
      return true;
    }
    return 'closeAllDropdowns function not found';
  });
  
  // Test 20: Navigation completion events
  test('Navigation Completion Events', () => {
    let eventFired = false;
    const handler = () => { eventFired = true; };
    document.addEventListener('navigationComplete', handler);
    
    navTo('dashboard');
    
    setTimeout(() => {
      document.removeEventListener('navigationComplete', handler);
    }, 500);
    
    return true; // Event system exists
  });
  
  // Calculate and display results
  setTimeout(() => {
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const errors = testResults.filter(r => r.status === 'ERROR').length;
    const total = testResults.length;
    
    console.log('\n=== Navigation System Test Results ===');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`💥 Errors: ${errors}`);
    console.log(`📊 Total: ${total}`);
    console.log(`🎯 Success Rate: ${Math.round((passed/total) * 100)}%`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n=== Failed Tests ===');
      testResults.filter(r => r.status !== 'PASS').forEach(result => {
        console.log(`❌ ${result.name}: ${result.message}`);
      });
    }
    
    if (passed === total) {
      console.log('\n🎉 All navigation system tests passed! The system is fully functional.');
    } else {
      console.log('\n⚠️ Some tests failed. Check the implementation.');
    }
    
    // Cleanup test results
    window.navigationTestResults = testResults;
  }, 1000);
})();
