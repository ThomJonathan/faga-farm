# TODO: Implement User Session Tracking, Display Real Name, and Logout Functionality

## Steps to Complete

- [x] Add session utilities in `src/lib/auth.js` for setting/getting/clearing user cookies
- [x] Update `src/app/api/auth/login/route.js` to set a secure cookie with user data on successful login
- [x] Create `src/app/api/auth/logout/route.js` to clear the session cookie
- [x] Update `src/components/DashboardLayout.js` to make logout an API call instead of link (desktop and mobile)
- [x] Update dashboard pages (`farm-worker/page.js`, `sales-person/page.js`, `manager/page.js`) to retrieve user from cookie and pass to DashboardLayout
- [x] Create `middleware.js` to protect dashboard routes by checking for valid session
- [x] Test login flow, name display on dashboards, and logout functionality
- [x] Ensure dashboards redirect to login if no session
