# PowerShell script to deploy with production URLs
Write-Host "🚀 Deploying CaseCrux to Production" -ForegroundColor Cyan

Set-Location "client"

# Build and deploy (uses .env by default which has production URLs)
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build

Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Yellow
npx vercel --prod

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📋 URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: https://casecrux.vercel.app"
Write-Host "   Backend: https://server-hi67nz5kn-thejas-projects-b95e5b9f.vercel.app"
Write-Host ""
Write-Host "⚠️  Note: Backend may still have authentication issues" -ForegroundColor Yellow
Write-Host "   Consider deploying backend to Railway for better reliability"
