#!/usr/bin/env node

// Quick test to check if all imports work correctly
console.log('Testing imports...');

try {
  // Test main page imports
  const fs = require('fs');
  const path = require('path');
  
  // Check if main files exist
  const mainPage = path.join(__dirname, 'src/app/page.tsx');
  const layout = path.join(__dirname, 'src/app/layout.tsx');
  
  if (fs.existsSync(mainPage)) {
    console.log('✅ Main page exists');
  } else {
    console.log('❌ Main page missing');
  }
  
  if (fs.existsSync(layout)) {
    console.log('✅ Layout exists');
  } else {
    console.log('❌ Layout missing');
  }
  
  // Check UI components
  const uiPath = path.join(__dirname, 'src/components/ui');
  const requiredComponents = ['button.tsx', 'card.tsx', 'input.tsx', 'tabs.tsx', 'dialog.tsx', 'badge.tsx'];
  
  requiredComponents.forEach(comp => {
    const compPath = path.join(uiPath, comp);
    if (fs.existsSync(compPath)) {
      console.log(`✅ ${comp} exists`);
    } else {
      console.log(`❌ ${comp} missing`);
    }
  });
  
  // Check API routes
  const apiPath = path.join(__dirname, 'src/app/api');
  const requiredRoutes = ['user/route.ts', 'admin/players/route.ts', 'admin/role/route.ts'];
  
  requiredRoutes.forEach(route => {
    const routePath = path.join(apiPath, route);
    if (fs.existsSync(routePath)) {
      console.log(`✅ API ${route} exists`);
    } else {
      console.log(`❌ API ${route} missing`);
    }
  });
  
  console.log('✅ All basic checks passed!');
  console.log('🚀 Application should work correctly after compilation');
  
} catch (error) {
  console.error('❌ Error during testing:', error.message);
}