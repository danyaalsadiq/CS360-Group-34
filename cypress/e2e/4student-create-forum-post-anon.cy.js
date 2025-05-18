/// <reference types="cypress" />

describe('Student Create Forum Post', () => {
  beforeEach(() => {
    // Reset application state before each test
    cy.visit('/');
    cy.wait(2000); // Give app time to initialize
  });

  it('should allow a student to create a forum post', () => {
    // TEST STEP 1: Login as student
    cy.log('Logging in as student');
    
    // Navigate to auth page if needed
    cy.url().then(url => {
      if (!url.includes('/auth')) {
        // Check if already logged in
        cy.get('body').then($body => {
          if (!($body.text().includes('Dashboard') || 
                $body.text().includes('Forums') || 
                $body.text().includes('Appointments'))) {
            cy.visit('/auth');
          }
        });
      }
    });
    
    // Only perform login if on auth page
    cy.url().then(url => {
      if (url.includes('/auth')) {
        // Make sure we're on the login tab if there are tabs
        cy.get('body').then($body => {
          if ($body.find('[value="login"]').length > 0) {
            cy.get('[value="login"]').click();
          }
        });
        
        // Fill in login credentials
        cy.get('input[name="username"]').should('be.visible').clear().type('student1234');
        cy.get('input[name="password"]').should('be.visible').clear().type('123123');
        
        // Submit the login form
        cy.get('button[type="submit"]').click();
        
        // Verify successful login - should redirect away from auth page
        cy.url({ timeout: 10000 }).should('not.include', '/auth');
      }
    });
    
    // TEST STEP 2: Navigate to Forums page
    cy.log('Navigating to Forums page');
    
    // Try to find and click the Forums link
    cy.get('body').then($body => {
      if ($body.find('[data-testid="forums-link"]').length > 0) {
        cy.get('[data-testid="forums-link"]').click();
      } else if ($body.find('a[href="/forums"]').length > 0) {
        cy.get('a[href="/forums"]').click();
      } else if ($body.find('a:contains("Forums")').length > 0) {
        cy.contains('a', 'Forums').click();
      } else if ($body.find('button:contains("Forums")').length > 0) {
        cy.contains('button', 'Forums').click();
      } else {
        // Direct navigation if we can't find a link
        cy.visit('/forums');
      }
    });
    
    // Verify we're on the forums page
    cy.url({ timeout: 10000 }).should('include', '/forums');
    
    // TEST STEP 3: Click on "New Post" button in the top right
    cy.log('Looking for the blue New Post button');
    
    // Wait a bit longer to ensure the page is fully loaded
    cy.wait(3000);
    
    // Add debug to log all buttons on the page
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons on the page`);
      
      // Log the text content of each button to help debug
      $buttons.each((index, button) => {
        cy.log(`Button ${index}: "${button.textContent.trim()}" with classes: ${button.className}`);
      });
    });
    
    // Try with more specific selectors for the blue button
    cy.get('body').then($body => {
      // First look for buttons with text exactly matching "New Post"
      if ($body.find('button:contains("New Post")').length > 0) {
        cy.log('Found button with "New Post" text');
        cy.contains('button', 'New Post').click({force: true});
      } 
      // Then look for buttons with more specific classes that might be the blue button
      else if ($body.find('button.bg-blue, button.bg-primary, button.blue, button.primary, button.btn-primary').length > 0) {
        cy.log('Found button with blue/primary class');
        cy.get('button.bg-blue, button.bg-primary, button.blue, button.primary, button.btn-primary').first().click({force: true});
      }
      // Look for "New Post" text exactly
      else if ($body.find('button').filter((i, el) => el.textContent.trim() === 'New Post').length > 0) {
        cy.log('Found button with exact "New Post" text match');
        cy.get('button').filter((i, el) => el.textContent.trim() === 'New Post').click({force: true});
      }
      // Look for button with partial text match, case insensitive
      else if ($body.find('button').filter((i, el) => el.textContent.toLowerCase().includes('new post')).length > 0) {
        cy.log('Found button with partial "new post" text match');
        cy.get('button').filter((i, el) => el.textContent.toLowerCase().includes('new post')).click({force: true});
      }
      // Try other common variations
      else if ($body.find('button:contains("Create Post")').length > 0) {
        cy.log('Found button with "Create Post" text');
        cy.contains('button', 'Create Post').click({force: true});
      } 
      else if ($body.find('button:contains("Add Post")').length > 0) {
        cy.log('Found button with "Add Post" text');
        cy.contains('button', 'Add Post').click({force: true});
      }
      // Try to find button positioned in the top right (typically has flex/right/end classes)
      else if ($body.find('button.justify-end, button.items-end, button.flex-end, button.right, button.float-right').length > 0) {
        cy.log('Found button with positioning classes');
        cy.get('button.justify-end, button.items-end, button.flex-end, button.right, button.float-right').first().click({force: true});
      }
      // If all else fails, click the button that's positioned in the top right area of the screen
      else {
        cy.log('Fallback: looking for any button in the top right area');
        // Look for button within a top navigation or header element 
        if ($body.find('header button, nav button, .navbar button, .header button').length > 0) {
          cy.get('header button, nav button, .navbar button, .header button').last().click({force: true});
        } else {
          // Last resort: take a screenshot to see what the page looks like
          cy.screenshot('forum-page-before-click');
          // Try clicking the last button (often action buttons are last in the DOM)
          cy.get('button').last().click({force: true});
        }
      }
    });
    
    // Wait for post form to appear
    cy.wait(2000);
    
    // TEST STEP 4: Fill in post title and content
    cy.log('Filling in post details');
    
    // Fill in the title
    cy.get('input[name="title"]').should('be.visible').clear().type('student post automated test');
    
    // Fill in the content
    cy.get('textarea[name="content"]').should('be.visible').clear().type('student automated post test content');
    
    // Select a category if available
    cy.get('body').then($body => {
      if ($body.find('select[name="category"]').length > 0) {
        cy.get('select[name="category"]').select(0); // Select first category
      } else if ($body.find('[data-testid="category-dropdown"]').length > 0) {
        cy.get('[data-testid="category-dropdown"]').click();
        cy.get('[data-testid="category-option"]').first().click();
      }
    });
    cy.contains('Post Anonymously', { matchCase: false }).first().click({ force: true });
    // TEST STEP 5: Submit the post
    cy.log('Creating the post');
    
    cy.get('body').then($body => {
      if ($body.find('[data-testid="submit-post-button"]').length > 0) {
        cy.get('[data-testid="submit-post-button"]').click();
      } else if ($body.find('button[type="submit"]').length > 0) {
        cy.get('button[type="submit"]').click();
      } else if ($body.find('button:contains("Create Post")').length > 0) {
        cy.contains('button', 'Create Post').click();
      } else if ($body.find('button:contains("Submit")').length > 0) {
        cy.contains('button', 'Submit').click();
      } else if ($body.find('button:contains("Post")').length > 0) {
        cy.contains('button', 'Post').click();
      } else {
        // Try submitting the form
        cy.get('form').submit();
      }
    });
    
    // TEST STEP 6: Verify post was created
    cy.log('Verifying post was created');
    
    // Wait for redirect or UI update
    cy.wait(3000);
    
    // Check that we can see our post title
    cy.contains('student post automated test').should('be.visible');
    
    // Log success
    cy.log('Successfully created forum post');
  });
});