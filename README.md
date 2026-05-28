# AmrStore Login + Admin Version

Upload these files to your GitHub Pages repo root.

## Important

Delete old duplicate files first:
- /app.js
- /style.css
- /js/catalog.js
- /js/dynamic-products.js
- /js/products.js

Keep only:
- index.html
- products.html
- cart.html
- about.html
- contact.html
- login.html
- admin.html
- css/style.css
- js/app.js
- js/supabase-config.js

## Admin access

Admin URL:
https://ahmedamr91.github.io/eshop/admin.html

Login URL:
https://ahmedamr91.github.io/eshop/login.html

The approved admin email is set in js/app.js:

const ADMIN_EMAILS = ["ahmed.s@trufla.com"];

Create this user in:
Supabase > Authentication > Users > Add user

## Push

git add .
git commit -m "Add login and private admin panel"
git push origin main
