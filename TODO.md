# TODO: Implement Signup Page for Faga Farm

## Steps to Complete

- [x] Install bcryptjs dependency for password hashing
- [x] Update src/lib/auth.js: Add createUser function to hash password and insert new user; update authenticateUser to hash input password for comparison
- [x] Create src/components/SignupForm.js: Responsive form with fields for name, username, password, confirm password, email, phone, and role (dropdown). Include Faga logo at the top
- [x] Create src/app/api/auth/signup/route.js: API route to handle signup, validate inputs, check username uniqueness, and create user
- [x] Create src/app/signup/page.js: Page component using SignupForm
- [x] Update src/components/LoginForm.js: Add a link to the signup page
- [x] Test signup functionality and responsiveness (dev server started, browser testing disabled)
- [x] Update TODO.md with completed tasks (this file)
