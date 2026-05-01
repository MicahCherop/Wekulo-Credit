# Netlify Deployment Guide

This project is ready to be deployed to Netlify.

### Build Settings
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

### Configuration
The `netlify.toml` file is already included to handle SPA routing.

### Environment Variables
You must set the following variables in the Netlify UI:
1. `VITE_SUPABASE_URL`: Your Supabase Project URL.
2. `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Key.

### Supabase URL Configuration
Don't forget to add your Netlify URL to the "Redirect URLs" in your Supabase Authentication settings to allow proper login redirects.
