/**
 * Security Tests for Project Display Feature
 * GitHub Issue #7
 */

// Тесты валидации названия проекта
function runSecurityTests() {
    console.log('🧪 Running Security Tests for Project Display...\n');
    
    let passed = 0;
    let failed = 0;
    
    // Test 1: Normal project name
    {
        const result = SecurityModule.validateProjectName('Meetify');
        if (result.valid && result.sanitized === 'Meetify') {
            console.log('✅ Test 1 PASSED: Normal project name');
            passed++;
        } else {
            console.log('❌ Test 1 FAILED: Normal project name');
            failed++;
        }
    }
    
    // Test 2: Project name with allowed special chars
    {
        const result = SecurityModule.validateProjectName('AI_Team.Office-2024');
        if (result.valid && result.sanitized === 'AI_Team.Office-2024') {
            console.log('✅ Test 2 PASSED: Allowed special characters');
            passed++;
        } else {
            console.log('❌ Test 2 FAILED: Allowed special characters');
            failed++;
        }
    }
    
    // Test 3: XSS attempt with script tag
    {
        const result = SecurityModule.validateProjectName('<script>alert("XSS")</script>');
        if (!result.valid && result.sanitized === 'scriptalertXSSscript') {
            console.log('✅ Test 3 PASSED: XSS script tag blocked');
            passed++;
        } else {
            console.log('❌ Test 3 FAILED: XSS script tag not blocked properly');
            console.log('   Sanitized:', result.sanitized);
            failed++;
        }
    }
    
    // Test 4: XSS with onerror attribute
    {
        const result = SecurityModule.validateProjectName('<img src=x onerror=alert(1)>');
        if (!result.valid && result.sanitized === 'img srcx onerroralert1') {
            console.log('✅ Test 4 PASSED: XSS onerror blocked');
            passed++;
        } else {
            console.log('❌ Test 4 FAILED: XSS onerror not blocked properly');
            console.log('   Sanitized:', result.sanitized);
            failed++;
        }
    }
    
    // Test 5: Length limit (50 chars)
    {
        const longName = 'A'.repeat(60);
        const result = SecurityModule.validateProjectName(longName);
        if (!result.valid && result.sanitized.length === 50) {
            console.log('✅ Test 5 PASSED: Length limit enforced (50 chars)');
            passed++;
        } else {
            console.log('❌ Test 5 FAILED: Length limit not enforced');
            console.log('   Length:', result.sanitized.length);
            failed++;
        }
    }
    
    // Test 6: Empty string
    {
        const result = SecurityModule.validateProjectName('');
        if (!result.valid && result.sanitized === '') {
            console.log('✅ Test 6 PASSED: Empty string rejected');
            passed++;
        } else {
            console.log('❌ Test 6 FAILED: Empty string not rejected');
            failed++;
        }
    }
    
    // Test 7: Only spaces
    {
        const result = SecurityModule.validateProjectName('   ');
        if (!result.valid && result.sanitized === '') {
            console.log('✅ Test 7 PASSED: Whitespace-only rejected');
            passed++;
        } else {
            console.log('❌ Test 7 FAILED: Whitespace-only not rejected');
            failed++;
        }
    }
    
    // Test 8: Non-string input
    {
        const result = SecurityModule.validateProjectName(12345);
        if (!result.valid && result.sanitized === '') {
            console.log('✅ Test 8 PASSED: Non-string input rejected');
            passed++;
        } else {
            console.log('❌ Test 8 FAILED: Non-string input not rejected');
            failed++;
        }
    }
    
    // Test 9: JavaScript protocol
    {
        const result = SecurityModule.validateProjectName('javascript:alert(1)');
        if (!result.valid) {
            console.log('✅ Test 9 PASSED: JavaScript protocol blocked');
            passed++;
        } else {
            console.log('❌ Test 9 FAILED: JavaScript protocol not blocked');
            failed++;
        }
    }
    
    // Test 10: HTML entities
    {
        const result = SecurityModule.validateProjectName('Project<div>Name');
        if (!result.valid && !result.sanitized.includes('<')) {
            console.log('✅ Test 10 PASSED: HTML entities removed');
            passed++;
        } else {
            console.log('❌ Test 10 FAILED: HTML entities not removed');
            console.log('   Sanitized:', result.sanitized);
            failed++;
        }
    }
    
    // Test 11: escapeHtml function
    {
        const html = '<script>alert("XSS")</script>';
        const escaped = SecurityModule.escapeHtml(html);
        if (escaped === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;') {
            console.log('✅ Test 11 PASSED: escapeHtml works correctly');
            passed++;
        } else {
            console.log('❌ Test 11 FAILED: escapeHtml not working');
            console.log('   Escaped:', escaped);
            failed++;
        }
    }
    
    // Test 12: sanitizeForDisplay
    {
        const html = '<b>Bold</b> <script>alert(1)</script>';
        const sanitized = SecurityModule.sanitizeForDisplay(html, 50);
        if (!sanitized.includes('<') && !sanitized.includes('>')) {
            console.log('✅ Test 12 PASSED: sanitizeForDisplay escapes HTML');
            passed++;
        } else {
            console.log('❌ Test 12 FAILED: sanitizeForDisplay not escaping');
            console.log('   Sanitized:', sanitized);
            failed++;
        }
    }
    
    // Test 13: Task name validation (max 100)
    {
        const longTask = 'B'.repeat(120);
        const result = SecurityModule.validateTaskName(longTask);
        if (!result.valid && result.sanitized.length === 100) {
            console.log('✅ Test 13 PASSED: Task name length limit (100 chars)');
            passed++;
        } else {
            console.log('❌ Test 13 FAILED: Task name length limit not enforced');
            console.log('   Length:', result.sanitized.length);
            failed++;
        }
    }
    
    // Test 14: Truncate function
    {
        const longText = 'A'.repeat(100);
        const truncated = SecurityModule.truncate(longText, 50);
        if (truncated.length === 50 && truncated.endsWith('...')) {
            console.log('✅ Test 14 PASSED: Truncate adds ellipsis');
            passed++;
        } else {
            console.log('❌ Test 14 FAILED: Truncate not working correctly');
            console.log('   Length:', truncated.length);
            failed++;
        }
    }
    
    // Test 15: Cyrillic support
    {
        const result = SecurityModule.validateProjectName('Проект-Альфа_2024');
        if (result.valid && result.sanitized === 'Проект-Альфа_2024') {
            console.log('✅ Test 15 PASSED: Cyrillic characters supported');
            passed++;
        } else {
            console.log('❌ Test 15 FAILED: Cyrillic characters not supported');
            console.log('   Sanitized:', result.sanitized);
            failed++;
        }
    }
    
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
    
    return { passed, failed, total: passed + failed };
}

// Run tests when DOM is ready
if (typeof window !== 'undefined') {
    window.runSecurityTests = runSecurityTests;
    
    // Auto-run if URL has ?test parameter
    if (window.location.search.includes('test')) {
        document.addEventListener('DOMContentLoaded', runSecurityTests);
    }
}