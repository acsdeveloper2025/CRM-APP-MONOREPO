import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

/**
 * Global Teardown for Playwright Tests
 * Cleans up the test environment after all tests have completed
 */

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');

  const apiURL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000';

  try {
    // 1. Cleanup test data
    await cleanupTestData(apiURL);

    // 2. Generate test report summary
    await generateTestSummary();

    // 3. Archive test artifacts
    await archiveTestArtifacts();

    // 4. Cleanup temporary files
    await cleanupTemporaryFiles();

    console.log('✅ Global test teardown completed successfully');

  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw error to avoid masking test failures
  }
}

/**
 * Cleanup test data from database
 */
async function cleanupTestData(apiURL: string) {
  console.log('🗑️ Cleaning up test data...');

  try {
    // Cleanup test cases
    const casesResponse = await fetch(`${apiURL}/api/test/cases/cleanup`, {
      method: 'DELETE'
    });

    if (casesResponse.ok) {
      console.log('✅ Test cases cleaned up');
    }

    // Cleanup test uploads
    const uploadsResponse = await fetch(`${apiURL}/api/test/uploads/cleanup`, {
      method: 'DELETE'
    });

    if (uploadsResponse.ok) {
      console.log('✅ Test uploads cleaned up');
    }

    // Cleanup test users (optional - might want to keep for next run)
    if (process.env.CLEANUP_TEST_USERS === 'true') {
      const usersResponse = await fetch(`${apiURL}/api/test/users/cleanup`, {
        method: 'DELETE'
      });

      if (usersResponse.ok) {
        console.log('✅ Test users cleaned up');
      }
    }

  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
  }
}

/**
 * Generate test execution summary
 */
async function generateTestSummary() {
  console.log('📊 Generating test summary...');

  try {
    // Read test results if available
    let testResults = null;
    try {
      const resultsFile = await fs.readFile('test-results/test-results.json', 'utf8');
      testResults = JSON.parse(resultsFile);
    } catch (error) {
      console.log('No test results file found');
    }

    const summary = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: !!process.env.CI
      },
      configuration: {
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001',
        apiURL: process.env.PLAYWRIGHT_API_URL || 'http://localhost:3000',
        browsers: ['chromium', 'firefox', 'webkit'],
        devices: ['desktop', 'mobile', 'tablet']
      },
      testResults: testResults ? {
        totalTests: testResults.stats?.total || 0,
        passed: testResults.stats?.passed || 0,
        failed: testResults.stats?.failed || 0,
        skipped: testResults.stats?.skipped || 0,
        duration: testResults.stats?.duration || 0
      } : null,
      artifacts: {
        screenshots: await countFiles('test-results/screenshots'),
        videos: await countFiles('test-results/videos'),
        traces: await countFiles('test-results/traces'),
        downloads: await countFiles('test-results/downloads')
      }
    };

    await fs.writeFile(
      'test-results/test-summary.json', 
      JSON.stringify(summary, null, 2)
    );

    // Generate human-readable summary
    const readableSummary = generateReadableSummary(summary);
    await fs.writeFile('test-results/test-summary.md', readableSummary);

    console.log('✅ Test summary generated');

  } catch (error) {
    console.warn('⚠️ Failed to generate test summary:', error);
  }
}

/**
 * Archive test artifacts for long-term storage
 */
async function archiveTestArtifacts() {
  console.log('📦 Archiving test artifacts...');

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveDir = `test-results/archives/${timestamp}`;

    // Create archive directory
    await fs.mkdir(archiveDir, { recursive: true });

    // Copy important artifacts
    const artifactsToCopy = [
      'test-results/test-results.json',
      'test-results/test-summary.json',
      'test-results/test-summary.md',
      'test-results/html-report'
    ];

    for (const artifact of artifactsToCopy) {
      try {
        const stats = await fs.stat(artifact);
        if (stats.isDirectory()) {
          await copyDirectory(artifact, path.join(archiveDir, path.basename(artifact)));
        } else {
          await fs.copyFile(artifact, path.join(archiveDir, path.basename(artifact)));
        }
      } catch (error) {
        // Artifact might not exist, continue
      }
    }

    console.log(`✅ Test artifacts archived to: ${archiveDir}`);

  } catch (error) {
    console.warn('⚠️ Failed to archive test artifacts:', error);
  }
}

/**
 * Cleanup temporary files and directories
 */
async function cleanupTemporaryFiles() {
  console.log('🧽 Cleaning up temporary files...');

  try {
    // Cleanup old archives (keep last 10)
    const archivesDir = 'test-results/archives';
    try {
      const archives = await fs.readdir(archivesDir);
      if (archives.length > 10) {
        const sortedArchives = archives.sort().reverse();
        const archivesToDelete = sortedArchives.slice(10);

        for (const archive of archivesToDelete) {
          await fs.rm(path.join(archivesDir, archive), { recursive: true });
          console.log(`🗑️ Deleted old archive: ${archive}`);
        }
      }
    } catch (error) {
      // Archives directory might not exist
    }

    // Cleanup large video files if not in CI
    if (!process.env.CI) {
      try {
        const videoFiles = await fs.readdir('test-results/videos');
        for (const videoFile of videoFiles) {
          const videoPath = path.join('test-results/videos', videoFile);
          const stats = await fs.stat(videoPath);
          
          // Delete videos larger than 50MB
          if (stats.size > 50 * 1024 * 1024) {
            await fs.unlink(videoPath);
            console.log(`🗑️ Deleted large video file: ${videoFile}`);
          }
        }
      } catch (error) {
        // Videos directory might not exist
      }
    }

    // Cleanup generated test fixtures
    const tempFixtures = [
      'tests/fixtures/generated'
    ];

    for (const fixture of tempFixtures) {
      try {
        await fs.rm(fixture, { recursive: true });
      } catch (error) {
        // Directory might not exist
      }
    }

    console.log('✅ Temporary files cleaned up');

  } catch (error) {
    console.warn('⚠️ Failed to cleanup temporary files:', error);
  }
}

/**
 * Helper function to count files in a directory
 */
async function countFiles(directory: string): Promise<number> {
  try {
    const files = await fs.readdir(directory);
    return files.length;
  } catch (error) {
    return 0;
  }
}

/**
 * Helper function to copy directory recursively
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Generate human-readable test summary
 */
function generateReadableSummary(summary: any): string {
  return `# Test Execution Summary

## Environment
- **Timestamp**: ${summary.timestamp}
- **Node Version**: ${summary.environment.nodeVersion}
- **Platform**: ${summary.environment.platform}
- **Architecture**: ${summary.environment.arch}
- **CI Environment**: ${summary.environment.ci ? 'Yes' : 'No'}

## Configuration
- **Base URL**: ${summary.configuration.baseURL}
- **API URL**: ${summary.configuration.apiURL}
- **Browsers**: ${summary.configuration.browsers.join(', ')}
- **Devices**: ${summary.configuration.devices.join(', ')}

## Test Results
${summary.testResults ? `
- **Total Tests**: ${summary.testResults.totalTests}
- **Passed**: ${summary.testResults.passed}
- **Failed**: ${summary.testResults.failed}
- **Skipped**: ${summary.testResults.skipped}
- **Duration**: ${Math.round(summary.testResults.duration / 1000)}s
- **Success Rate**: ${Math.round((summary.testResults.passed / summary.testResults.totalTests) * 100)}%
` : '- No test results available'}

## Artifacts Generated
- **Screenshots**: ${summary.artifacts.screenshots}
- **Videos**: ${summary.artifacts.videos}
- **Traces**: ${summary.artifacts.traces}
- **Downloads**: ${summary.artifacts.downloads}

## Reports
- HTML Report: \`test-results/html-report/index.html\`
- JSON Results: \`test-results/test-results.json\`
- JUnit XML: \`test-results/junit.xml\`

---
*Generated by Playwright Test Suite*
`;
}

export default globalTeardown;
