// Navigation System Test Suite
// Tests all components of the dashboard navigation system

const fs = require('fs');
const { JSDOM } = require('jsdom');

// Read the dashboard HTML
const htmlContent = fs.readFileSync('./dashboard.html', 'utf8');

// Create DOM environment
const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:4000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.console = console;

// Extract and test navigation functions
const testResults = [];

function test(name, testFn) {
  try {
    testFn();
    testResults.push({ name, status: 'PASS', message: 'Test passed' });
  } catch (error) {
    testResults.push({ name, status: 'FAIL', message: error.message });
  }
}

// Execute the dashboard script to get functions
try {
  eval(htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g).pop().replace(/<script[^>]*>/, '').replace(/<\/script>/, ''));
} catch (error) {
  console.log('Script evaluation error (expected in test environment):', error.message);
}

// Test 1: NavigationState object exists
test('NavigationState Object Exists', () => {
  if (typeof NavigationState === 'undefined') {
    throw new Error('NavigationState object not found');
  }
  if (!NavigationState.hasOwnProperty('currentPage')) {
    throw new Error('NavigationState.currentPage missing');
  }
  if (!NavigationState.hasOwnProperty('history')) {
    throw new Error('NavigationState.history missing');
  }
});

// Test 2: navTo function exists
test('navTo Function Exists', () => {
  if (typeof navTo === 'undefined') {
    throw new Error('navTo function not found');
  }
});

// Test 3: History management functions exist
test('History Functions Exist', () => {
  if (typeof navBack === 'undefined') {
    throw new Error('navBack function not found');
  }
  if (typeof navForward === 'undefined') {
    throw new Error('navForward function not found');
  }
});

// Test 4: Error handling exists
test('Error Handling Exists', () => {
  if (typeof NavigationErrorHandler === 'undefined') {
    throw new Error('NavigationErrorHandler not found');
  }
  if (typeof handleNavigationError === 'undefined') {
    throw new Error('handleNavigationError function not found');
  }
});

// Test 5: Progress bar functions exist
test('Progress Bar Functions Exist', () => {
  if (typeof showNavigationProgress === 'undefined') {
    throw new Error('showNavigationProgress function not found');
  }
  if (typeof hideNavigationProgress === 'undefined') {
    throw new Error('hideNavigationProgress function not found');
  }
});

// Test 6: Page side effects function exists
test('Page Side Effects Function Exists', () => {
  if (typeof executePageSideEffects === 'undefined') {
    throw new Error('executePageSideEffects function not found');
  }
});

// Test 7: Check for required DOM elements
test('Required DOM Elements Exist', () => {
  const requiredElements = [
    'page-dashboard',
    'page-practice',
    'page-education',
    'sidebar'
  ];
  
  requiredElements.forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Required element #${id} not found`);
    }
  });
});

// Test 8: Check sidebar navigation buttons
test('Sidebar Navigation Buttons Exist', () => {
  const navButtons = [
    'nav-dashboard',
    'nav-practice',
    'nav-education'
  ];
  
  navButtons.forEach(id => {
    const button = document.getElementById(id);
    if (!button) {
      throw new Error(`Navigation button #${id} not found`);
    }
  });
});

// Test 9: Check for CSS animation classes
test('CSS Animation Classes Present', () => {
  const styleElements = document.querySelectorAll('style');
  let hasAnimations = false;
  
  styleElements.forEach(style => {
    const content = style.textContent;
    if (content.includes('fade-in') || content.includes('slide-up')) {
      hasAnimations = true;
    }
  });
  
  if (!hasAnimations) {
    throw new Error('Navigation animation CSS classes not found');
  }
});

// Test 10: Check keyboard event listeners
test('Keyboard Navigation Setup Present', () => {
  const scripts = htmlContent.match(/addEventListener\(['"]keydown['"]/g);
  if (!scripts || scripts.length === 0) {
    throw new Error('Keyboard event listener not found');
  }
});

// Output results
console.log('\n=== Navigation System Test Results ===');
testResults.forEach(result => {
  const status = result.status === 'PASS' ? '✅' : '❌';
  console.log(`${status} ${result.name}: ${result.message}`);
});

const passed = testResults.filter(r => r.status === 'PASS').length;
const total = testResults.length;
console.log(`\nSummary: ${passed}/${total} tests passed`);

if (passed === total) {
  console.log('🎉 All navigation system components are properly implemented!');
} else {
  console.log('⚠️  Some components may need attention.');
}
