const { test, describe } = require('node:test');
const assert = require('node:assert');
const http = require('http');

describe('Application Integration Tests', () => {
  let server;
  let app;
  let port;

  // Start server before tests
  test('should start server successfully', async () => {
    // Set test environment
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.NODE_ENV = 'test';
    
    // Use random port to avoid conflicts
    port = 3000 + Math.floor(Math.random() * 1000);
    
    // Import and start app
    app = require('../app');
    
    // Wait for server to start
    await new Promise((resolve) => {
      server = app.listen(port, resolve);
    });
    
    assert.ok(server, 'Server should be running');
  });

  test('should respond to health check', async () => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/health',
          method: 'GET'
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              assert.strictEqual(res.statusCode, 200);
              const response = JSON.parse(data);
              assert.strictEqual(response.status, 'healthy');
              assert.ok(response.timestamp);
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        }
      );
      
      req.on('error', reject);
      req.end();
    });
  });

  test('should serve web interface', async () => {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'GET'
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              assert.strictEqual(res.statusCode, 200);
              assert.ok(data.includes('AI Travel Agent'));
              assert.ok(data.includes('html'));
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        }
      );
      
      req.on('error', reject);
      req.end();
    });
  });

  // Cleanup after tests
  test('should stop server', async () => {
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });
});