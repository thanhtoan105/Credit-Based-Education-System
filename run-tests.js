#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🧪 QLDSV_TC Test Suite Runner')
console.log('================================\n')

// Check if test files exist
const testDir = path.join(__dirname, '__tests__')
if (!fs.existsSync(testDir)) {
  console.error('❌ Test directory not found!')
  process.exit(1)
}

// Count test files
const countTestFiles = (dir) => {
  let count = 0
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true })
    
    for (const file of files) {
      if (file.isDirectory()) {
        count += countTestFiles(path.join(dir, file.name))
      } else if (file.name.endsWith('.test.ts') || file.name.endsWith('.test.tsx')) {
        count++
      }
    }
  } catch (error) {
    // Directory might not exist, return 0
  }
  
  return count
}

const testFileCount = countTestFiles(testDir)
console.log(`📁 Found ${testFileCount} test files\n`)

// Function to run all tests
const runAllTests = () => {
  console.log('🚀 Starting comprehensive test suite...\n')
  
  try {
    console.log('Running all tests with coverage...')
    execSync('npm run test:coverage', {
      stdio: 'inherit'
    })
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('📊 Check the coverage report for detailed results.')
    return true
  } catch (error) {
    console.error('\n❌ Some tests failed. Please review the output above.')
    return false
  }
}

// Main execution
const success = runAllTests()
process.exit(success ? 0 : 1)
