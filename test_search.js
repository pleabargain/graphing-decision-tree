// https://github.com/pleabargain/graphing-decision-tree/tree/interactive
/**
 * Test script for search functionality
 * Tests the /api/search-files endpoint with target word: phone
 */

const http = require('http');

const TARGET_WORD = 'phone';
const PORT = 3000;
const HOST = 'localhost';

function testSearch(query) {
    return new Promise((resolve, reject) => {
        const url = `/api/search-files?q=${encodeURIComponent(query)}`;
        
        const options = {
            hostname: HOST,
            port: PORT,
            path: url,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: result });
                } catch (error) {
                    // Show first 200 chars of response for debugging
                    const preview = data.substring(0, 200);
                    reject(new Error(`Failed to parse JSON: ${error.message}\nResponse preview: ${preview}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

async function runTest() {
    console.log('='.repeat(60));
    console.log('Testing Search Function');
    console.log('='.repeat(60));
    console.log(`Target word: "${TARGET_WORD}"`);
    console.log(`Server: http://${HOST}:${PORT}`);
    console.log('-'.repeat(60));

    try {
        const result = await testSearch(TARGET_WORD);
        
        console.log(`\nStatus Code: ${result.statusCode}`);
        console.log(`\nResults Found: ${result.data.files ? result.data.files.length : 0}`);
        
        if (result.data.files && result.data.files.length > 0) {
            console.log('\nSearch Results:');
            console.log('-'.repeat(60));
            
            result.data.files.forEach((file, index) => {
                console.log(`\n${index + 1}. File: ${file.filename}`);
                console.log(`   Filename Match: ${file.filenameMatch ? 'YES' : 'NO'}`);
                console.log(`   Content Match: ${file.contentMatch ? 'YES' : 'NO'}`);
                
                if (file.snippets && file.snippets.length > 0) {
                    console.log(`   Snippets (${file.snippets.length}):`);
                    file.snippets.forEach((snippet, i) => {
                        console.log(`      ${i + 1}. ${snippet.substring(0, 80)}...`);
                    });
                }
            });
        } else {
            console.log('\nNo results found for the search query.');
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('Test completed successfully!');
        console.log('='.repeat(60));
        
    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('Test Failed!');
        console.error('='.repeat(60));
        console.error(`Error: ${error.message}`);
        
        if (error.code === 'ECONNREFUSED') {
            console.error('\nMake sure the server is running:');
            console.error('  npm start');
        }
        
        process.exit(1);
    }
}

runTest();

