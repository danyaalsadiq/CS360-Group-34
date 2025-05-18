/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    // Reset application state before each test
    cy.visit('/');
    cy.wait(2000); // Give app time to initialize
  });

  it('should allow a student to login and logout', () => {
    // Check if we're already on login page, if not navigate there
    cy.url().then(url => {
      if (!url.includes('/auth')) {
        // We might already be logged in, so try to logout first
        cy.get('body').then($body => {
          if ($body.text().includes('Dashboard') || 
              $body.text().includes('Logout') || 
              $body.text().includes('Sign out')) {
            // Find and click logout
            cy.log('Already logged in, logging out first');
            // Look for logout button in various locations
            if ($body.find('[data-testid="logout-button"]').length > 0) {
              cy.get('[data-testid="logout-button"]').click();
            } else if ($body.find('button:contains("Logout")').length > 0) {
              cy.contains('button', 'Logout').click();
            } else if ($body.find('button:contains("Sign out")').length > 0) {
              cy.contains('button', 'Sign out').click();
            } else {
              // Look for a user menu that might contain logout
              cy.get('body').then($newBody => {
                if ($newBody.find('[data-testid="user-menu"]').length > 0) {
                  cy.get('[data-testid="user-menu"]').click();
                  cy.wait(500);
                  cy.contains('Logout').click();
                } else if ($newBody.find('.avatar, .user-avatar, .profile-icon').length > 0) {
                  cy.get('.avatar, .user-avatar, .profile-icon').first().click();
                  cy.wait(500);
                  cy.contains('Logout').click();
                }
              });
            }
            cy.wait(2000); // Wait for logout to complete
          }
        });
        
        // Navigate to auth page
        cy.visit('/auth');
      }
    });

    // TEST STEP 1: Login as student
    cy.log('Logging in as student');
    
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
    
    // Additional verification checks

    
    cy.log('Login successful');
    
    // TEST STEP 2: Logout
    cy.log('Logging out');
    
    // Try different approaches to find the logout button
    cy.get('body').then($body => {
      // Direct logout button
      if ($body.find('[data-testid="logout-button"]').length > 0) {
        cy.get('[data-testid="logout-button"]').click();
      } 
      // Text-based buttons
      else if ($body.find('button:contains("Logout")').length > 0) {
        cy.contains('button', 'Logout').click();
      } 
      else if ($body.find('button:contains("Sign out")').length > 0) {
        cy.contains('button', 'Sign out').click();
      }
      // Links
      else if ($body.find('a:contains("Logout")').length > 0) {
        cy.contains('a', 'Logout').click();
      }
      else if ($body.find('a:contains("Sign out")').length > 0) {
        cy.contains('a', 'Sign out').click();
      }
      // User menu that contains logout
      else if ($body.find('[data-testid="user-menu"]').length > 0) {
        cy.get('[data-testid="user-menu"]').click();
        cy.wait(500);
        cy.contains('Logout').click();
      }
      // Avatar/profile icons that might open a menu
      else if ($body.find('.avatar, .user-avatar, .profile-icon').length > 0) {
        cy.get('.avatar, .user-avatar, .profile-icon').first().click();
        cy.wait(500);
        cy.contains('Logout').click();
      }
      // Sidebar navigation
      else if ($body.find('.sidebar, [data-testid="sidebar"]').find('button:contains("Logout")').length > 0) {
        cy.get('.sidebar, [data-testid="sidebar"]').contains('button', 'Logout').click();
      }
      // Last resort: try to find any element with logout text
      else {
        cy.contains(/Logout|Sign out/i).click({force: true});
      }
    });
    
    // Verify logout was successful - should redirect to auth page or show login form
    cy.wait(2000); // Give logout time to process
    
    cy.url().then(url => {
      if (url.includes('/auth')) {
        cy.log('Redirected to auth page');
      } else {
        // If not redirected, verify we see login elements
        cy.get('body').should(($body) => {
          const bodyText = $body.text();
          expect(
            bodyText.includes('Login') || 
            bodyText.includes('Sign In') || 
            bodyText.includes('Username')
          ).to.be.true;
        });
      }
    });
    
    cy.log('Logout successful');
  });
});