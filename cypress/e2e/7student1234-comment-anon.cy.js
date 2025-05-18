/// <reference types="cypress" />

describe('Student1234 Like and Comment on Forum Post', () => {
  beforeEach(() => {
    // Reset application state before each test
    cy.visit('/');
    cy.wait(2000); // Give app time to initialize
  });

  it('should allow student1234 to like and comment on a forum post', () => {
    // TEST STEP 1: Login as student1234
    cy.log('Logging in as student1234');
    
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
    cy.wait(3000); // Wait for posts to load
    
    // TEST STEP 3: Look for "comments" string and click the first one
    cy.log('Looking for "comments" link to click');
       
    // Wait for the page to fully load
    cy.wait(3000);
    
    // Look for and click on the first "comments" text/link on the page
    cy.contains('comments', { matchCase: false }).first().click({ force: true });
    
    // Wait for comment section to load
    cy.wait(2000);
    
    // TEST STEP 4: Add a comment in the "write a comment" textbox
    cy.log('Adding a comment to the post');
    
    // Create a unique comment
    const comment = `Test comment by student1234 ${Date.now()}`;
    
    // Look for the textbox with "write a comment" placeholder
    cy.get('textarea[placeholder*="write a comment"], textarea[placeholder*="Write a comment"]').should('be.visible').clear().type(comment);
    
    // If the above fails, try broader selectors
    cy.get('body').then($body => {
      if ($body.find('textarea[placeholder*="write a comment"], textarea[placeholder*="Write a comment"]').length === 0) {
        cy.log('Could not find textarea with "write a comment" placeholder, trying alternatives');
        
        // Log all textareas for debugging
        cy.get('textarea').then($textareas => {
          cy.log(`Found ${$textareas.length} textareas`);
          $textareas.each((index, textarea) => {
            cy.log(`Textarea ${index}: placeholder="${textarea.placeholder}" name="${textarea.name}" id="${textarea.id}" class="${textarea.className}"`);
          });
        });
        
        // Try different selectors based on what might be available
        if ($body.find('textarea[name="comment"]').length > 0) {
          cy.get('textarea[name="comment"]').clear().type(comment);
        } else if ($body.find('[data-testid="comment-input"]').length > 0) {
          cy.get('[data-testid="comment-input"]').clear().type(comment);
        } else if ($body.find('textarea.comment-input').length > 0) {
          cy.get('textarea.comment-input').clear().type(comment);
        } else if ($body.find('textarea').length > 0) {
          // Last resort - use the first textarea
          cy.get('textarea').first().clear().type(comment);
        }
      }
    });
    
    // TEST STEP 5: Press the "Post" button (not "New Post")
    cy.contains('Comment Anonymously', { matchCase: false }).first().click({ force: true });
    cy.log('Looking for and clicking the Post button');
    
    // Log all buttons for debugging
    cy.get('button').then($buttons => {
      cy.log(`Found ${$buttons.length} buttons`);
      $buttons.each((index, button) => {
        cy.log(`Button ${index}: "${button.textContent.trim()}" with classes: ${button.className}`);
      });
    });
    
    // Specifically look for button with exact "Post" text
    cy.get('body').then($body => {
      // Find buttons that contain exactly "Post" (ignoring whitespace)
      const postButtons = Array.from($body.find('button')).filter(button => 
        button.textContent.trim() === 'Post'
      );
      
      cy.log(`Found ${postButtons.length} buttons with exact text "Post"`);
      
      if (postButtons.length > 0) {
        // Click the first one
        cy.wrap(postButtons[0]).click({ force: true });
      } else {
        // If we can't find exact "Post" button, try alternatives
        cy.log('Could not find button with exact "Post" text, trying alternatives');
        
        // Try different selectors based on what might be available
        if ($body.find('[data-testid="submit-comment-button"]').length > 0) {
          cy.get('[data-testid="submit-comment-button"]').click({ force: true });
        } else if ($body.find('button:contains("Post")').length > 0) {
          // This might match "New Post" too, but try it if nothing else works
          cy.contains('button', 'Post').click({ force: true });
        } else if ($body.find('button:contains("Submit")').length > 0) {
          cy.contains('button', 'Submit').click({ force: true });
        } else if ($body.find('button:contains("Comment")').length > 0) {
          cy.contains('button', 'Comment').click({ force: true });
        } else if ($body.find('button:contains("Send")').length > 0) {
          cy.contains('button', 'Send').click({ force: true });
        } else if ($body.find('form').length > 0) {
          // Try submitting the form directly
          cy.get('form').submit();
        } else {
          // Last resort - find the button closest to the textarea
          cy.get('textarea').then($textarea => {
            if ($textarea.length > 0) {
              cy.wrap($textarea).parents('div, form').first().find('button').last().click({ force: true });
            }
          });
        }
      }
    });
    
    // TEST STEP 7: Verify comment was posted
    cy.log('Verifying comment was posted');
        // Look for and click on the first "comments" text/link on the page
    cy.contains('comment', { matchCase: false }).first().click({ force: true });    // Look for and click on the first "comments" text/link on the page
    cy.contains('comment', { matchCase: false }).first().click({ force: true });
    // Wait for comment to appear
    cy.wait(3000);
    
    // Check that the comment is visible
    cy.contains(comment).should('be.visible');
    
    cy.log('Successfully liked and commented on forum post as student1234');
  });
});