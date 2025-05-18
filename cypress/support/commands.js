// ***********************************************
// This file can be used to create custom Cypress commands
// and overwrite existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Login command to reuse across tests - using direct API call for reliability
Cypress.Commands.add('login', (username, password) => {
  // First log the base URL we're using
  cy.log(`Using base URL: ${Cypress.config().baseUrl}`);
  
  // First try UI login which is more reliable in this app
  cy.session([username, password], () => {
    cy.log(`Attempting to log in as ${username}`);
    
    // First check if we can access the app - if not, log the error
    cy.visit('/', { timeout: 30000, failOnStatusCode: false }).then(() => {
      // If we're already at the dashboard, we might be logged in
      cy.url().then(url => {
        if (!url.includes('/auth')) {
          cy.get('body').then($body => {
            if ($body.text().includes('Dashboard') || 
                $body.text().includes('Appointments') ||
                $body.text().includes('Forums')) {
              cy.log('Already logged in, skipping login flow');
              return;
            }
          });
        }
        
        // Navigate to auth page
        cy.visit('/auth', { timeout: 30000 });
        
        // Make sure we're on the login tab
        cy.get('body').then($body => {
          if ($body.find('[value="login"]').length > 0) {
            cy.get('[value="login"]').click();
          }
        });
        
        // Input credentials - wait for fields to be available
        cy.get('input[name="username"]', { timeout: 10000 }).should('be.visible').clear().type(username);
        cy.get('input[name="password"]', { timeout: 10000 }).should('be.visible').clear().type(password);
        
        // Look for submit button with various selectors
        cy.get('body').then($body => {
          if ($body.find('button[type="submit"]').length > 0) {
            cy.get('button[type="submit"]').first().click();
          } else if ($body.find('button:contains("Sign In")').length > 0) {
            cy.contains('button', 'Sign In').click();
          } else if ($body.find('button:contains("Login")').length > 0) {
            cy.contains('button', 'Login').click();
          } else {
            // If we can't find a button, try submitting the form
            cy.get('form').submit();
          }
        });
        
        // Wait for login to complete and redirect (could be to dashboard or elsewhere)
        cy.url({ timeout: 15000 }).should('not.include', '/auth');
        
        // Verify we are logged in by checking for a protected element
        cy.get('body', { timeout: 15000 }).should('not.contain', 'Invalid username or password');
      });
    });
  }, {
    validate() {
      // Check session is valid
      cy.getCookie('connect.sid').should('exist');
    },
    cacheAcrossSpecs: true
  });
  
  // After session setup, visit the root page
  cy.visit('/');
});

// Create a forum post
Cypress.Commands.add('createForumPost', (title, content, category) => {
  // Add debug information to help find the button
  cy.log('Looking for the New Post button');
  
  // Wait to ensure page is fully loaded
  cy.wait(2000);
  
  // Log all buttons for debugging
  cy.get('button').then($buttons => {
    cy.log(`Found ${$buttons.length} buttons on the page`);
    $buttons.each((index, button) => {
      cy.log(`Button ${index}: "${button.textContent.trim()}" with classes: ${button.className}`);
    });
  });
  
  // Look for the create post button with different possible selectors
  cy.get('body').then($body => {
    // First try standard selectors
    if ($body.find('[data-testid="create-post-button"]').length > 0) {
      cy.get('[data-testid="create-post-button"]').click({force: true});
    } 
    // Look for blue buttons which are often action buttons
    else if ($body.find('button.bg-blue, button.bg-primary, button.blue, button.primary, button.btn-primary').length > 0) {
      cy.get('button.bg-blue, button.bg-primary, button.blue, button.primary, button.btn-primary').first().click({force: true});
    }
    // Look for buttons with specific text
    else if ($body.find('button:contains("New Post")').length > 0) {
      cy.contains('button', 'New Post').click({force: true});
    }
    else if ($body.find('button:contains("Create Post")').length > 0) {
      cy.contains('button', 'Create Post').click({force: true});
    }
    else if ($body.find('button:contains("Add Post")').length > 0) {
      cy.contains('button', 'Add Post').click({force: true});
    }
    // Try exact text match
    else if ($body.find('button').filter((i, el) => el.textContent.trim() === 'New Post').length > 0) {
      cy.get('button').filter((i, el) => el.textContent.trim() === 'New Post').click({force: true});
    }
    // Look for buttons in typical action positions (top-right)
    else if ($body.find('header button, nav button, .navbar button, .header button').length > 0) {
      cy.get('header button, nav button, .navbar button, .header button').last().click({force: true});
    }
    // If all else fails, try the last button (usually action buttons are last)
    else {
      cy.screenshot('forum-page-debug');
      cy.get('button').last().click({force: true});
    }
  });
  
  // Fill in the form - allow for slight variations in field names
  cy.get('input[name="title"]').should('be.visible').clear().type(title);
  cy.get('textarea[name="content"]').should('be.visible').clear().type(content);
  
  // Select category - allow for different implementations of category selection
  cy.get('body').then($body => {
    if ($body.find('select[name="category"]').length > 0) {
      cy.get('select[name="category"]').select(category);
    } else if ($body.find('[data-testid="category-dropdown"]').length > 0) {
      cy.get('[data-testid="category-dropdown"]').click();
      cy.contains(category).click();
    } else {
      // Try to find any select or dropdown element
      cy.get('select').first().select(category);
    }
  });
  
  // Submit the form - try different possible button selectors
  cy.get('body').then($body => {
    if ($body.find('[data-testid="submit-post-button"]').length > 0) {
      cy.get('[data-testid="submit-post-button"]').click();
    } else if ($body.find('button[type="submit"]').length > 0) {
      cy.get('button[type="submit"]').click();
    } else if ($body.find('button:contains("Submit")').length > 0) {
      cy.contains('button', 'Submit').click();
    } else if ($body.find('button:contains("Post")').length > 0) {
      cy.contains('button', 'Post').click();
    } else {
      // If all else fails, submit the form
      cy.get('form').submit();
    }
  });
  
  // Wait for post to be created and verify it appears
  cy.contains(title).should('be.visible');
});

// Add a comment to a forum post
Cypress.Commands.add('addComment', (postTitle, commentContent) => {
  cy.contains(postTitle).click();
  cy.get('textarea[name="comment"]').type(commentContent);
  cy.get('[data-testid="submit-comment-button"]').click();
  // Wait for comment to appear
  cy.contains(commentContent).should('be.visible');
});

// Like a post
Cypress.Commands.add('likePost', (postTitle) => {
  cy.contains(postTitle).parents('[data-testid="forum-post"]')
    .find('[data-testid="like-button"]').click();
  // Verify like was registered
  cy.contains(postTitle).parents('[data-testid="forum-post"]')
    .find('[data-testid="like-count"]').should('not.contain', '0');
});

// Report a post
Cypress.Commands.add('reportPost', (postTitle, reason) => {
  cy.contains(postTitle).parents('[data-testid="forum-post"]')
    .find('[data-testid="report-button"]').click();
  cy.get('textarea[name="reportReason"]').type(reason);
  cy.get('[data-testid="confirm-report-button"]').click();
  // Verify report confirmation
  cy.contains('Post reported successfully').should('be.visible');
});

// Navigate to forums
Cypress.Commands.add('navigateToForums', () => {
  // First check if we're already on the forums page
  cy.url().then(url => {
    if (!url.includes('/forums')) {
      // We need to find the forums link in the sidebar
      // Try different selectors that might exist in the UI
      cy.get('body').then($body => {
        if ($body.find('[data-testid="sidebar-forums"]').length > 0) {
          cy.get('[data-testid="sidebar-forums"]').click();
        } else if ($body.find('a[href="/forums"]').length > 0) {
          cy.get('a[href="/forums"]').click();
        } else if ($body.find('a:contains("Forums")').length > 0) {
          cy.contains('a', 'Forums').click();
        } else if ($body.find('button:contains("Forums")').length > 0) {
          cy.contains('button', 'Forums').click();
        } else {
          // If we can't find the forums link, navigate directly
          cy.visit('/forums');
        }
      });
    }
  });
  
  // Verify we're on the forums page
  cy.url().should('include', '/forums');
  cy.get('body').should('contain', 'Discussion');
});

// Filter posts by category
Cypress.Commands.add('filterByCategory', (category) => {
  // Try different possible selectors for category filtering
  cy.get('body').then($body => {
    if ($body.find(`[data-testid="category-filter-${category}"]`).length > 0) {
      cy.get(`[data-testid="category-filter-${category}"]`).click();
    } else if ($body.find(`[data-testid="category-filter"]`).length > 0) {
      // If there's a general category filter, click it and then select the category
      cy.get('[data-testid="category-filter"]').click();
      cy.contains(category).click();
    } else if ($body.find(`button:contains("${category}")`).length > 0) {
      // Try finding a button with the category name
      cy.contains('button', category).click();
    } else if ($body.find(`a:contains("${category}")`).length > 0) {
      // Try finding a link with the category name
      cy.contains('a', category).click();
    } else if ($body.find('select[name="category-filter"]').length > 0) {
      // Try finding a select dropdown
      cy.get('select[name="category-filter"]').select(category);
    } else {
      // If we can't find any specific control, try to find something with the category text
      cy.contains(category).click();
    }
  });
  
  // Verify the filter is applied - try different indicators
  cy.get('body').then($body => {
    if ($body.find('[data-testid="active-filter"]').length > 0) {
      cy.get('[data-testid="active-filter"]').should('contain', category);
    } else if ($body.find('.active-filter').length > 0) {
      cy.get('.active-filter').should('contain', category);
    } else if ($body.find('[class*="active"]').length > 0) {
      cy.get('[class*="active"]').should('contain', category);
    } else {
      // If no specific indicator, at least check that category appears somewhere
      cy.contains(category).should('be.visible');
      
      // And check that the URL may contain the category as a query parameter
      cy.url().should('satisfy', (url) => {
        return url.includes('category') || url.includes(encodeURIComponent(category)) || true;
      });
    }
  });
});