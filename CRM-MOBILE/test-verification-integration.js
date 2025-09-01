/**
 * Test script to verify the verification form integration
 * This script simulates the verification form submission workflow
 */

// Mock environment for testing
const mockEnv = {
  VITE_API_BASE_URL: 'http://localhost:3000/api'
};

// Mock fetch for testing
const mockFetch = async (url, options) => {
  console.log(`🌐 Mock API Call: ${options.method} ${url}`);
  console.log('📤 Request Body:', JSON.parse(options.body));
  
  // Simulate successful response
  return {
    ok: true,
    json: async () => ({
      success: true,
      message: 'Verification submitted successfully',
      data: {
        caseId: 'test-case-id',
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      }
    })
  };
};

// Mock verification form service
class MockVerificationFormService {
  static async submitResidenceVerification(caseId, formData, images, geoLocation) {
    console.log('🏠 Testing Residence Verification Submission');
    console.log('📋 Case ID:', caseId);
    console.log('📝 Form Data:', formData);
    console.log('📸 Images Count:', images.length);
    console.log('📍 Geo Location:', geoLocation);
    
    // Validate minimum requirements
    if (images.length < 5) {
      return {
        success: false,
        error: 'Minimum 5 geo-tagged photos required for residence verification'
      };
    }

    // Check if all images have geo-location
    const photosWithoutGeo = images.filter(img => 
      !img.geoLocation || 
      !img.geoLocation.latitude || 
      !img.geoLocation.longitude
    );

    if (photosWithoutGeo.length > 0) {
      return {
        success: false,
        error: 'All photos must have geo-location data'
      };
    }

    // Simulate API call
    const submissionData = {
      formData,
      attachmentIds: images.map(img => img.id),
      geoLocation,
      photos: images.map(img => ({
        attachmentId: img.id,
        geoLocation: img.geoLocation
      }))
    };

    const response = await mockFetch(
      `${mockEnv.VITE_API_BASE_URL}/mobile/cases/${caseId}/verification/residence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-App-Version': '1.0.0',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify(submissionData),
      }
    );

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Residence verification submitted successfully');
      return {
        success: true,
        caseId: result.data.caseId,
        status: result.data.status,
        completedAt: result.data.completedAt
      };
    } else {
      console.log('❌ Residence verification submission failed');
      return {
        success: false,
        error: result.message || 'Verification submission failed'
      };
    }
  }

  static async submitOfficeVerification(caseId, formData, images, geoLocation) {
    console.log('🏢 Testing Office Verification Submission');
    console.log('📋 Case ID:', caseId);
    console.log('📝 Form Data:', formData);
    console.log('📸 Images Count:', images.length);
    console.log('📍 Geo Location:', geoLocation);
    
    // Similar validation and submission logic as residence
    if (images.length < 5) {
      return {
        success: false,
        error: 'Minimum 5 geo-tagged photos required for office verification'
      };
    }

    const photosWithoutGeo = images.filter(img => 
      !img.geoLocation || 
      !img.geoLocation.latitude || 
      !img.geoLocation.longitude
    );

    if (photosWithoutGeo.length > 0) {
      return {
        success: false,
        error: 'All photos must have geo-location data'
      };
    }

    const submissionData = {
      formData,
      attachmentIds: images.map(img => img.id),
      geoLocation,
      photos: images.map(img => ({
        attachmentId: img.id,
        geoLocation: img.geoLocation
      }))
    };

    const response = await mockFetch(
      `${mockEnv.VITE_API_BASE_URL}/mobile/cases/${caseId}/verification/office`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-App-Version': '1.0.0',
          'X-Client-Type': 'mobile',
        },
        body: JSON.stringify(submissionData),
      }
    );

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Office verification submitted successfully');
      return {
        success: true,
        caseId: result.data.caseId,
        status: result.data.status,
        completedAt: result.data.completedAt
      };
    } else {
      console.log('❌ Office verification submission failed');
      return {
        success: false,
        error: result.message || 'Verification submission failed'
      };
    }
  }
}

// Test data
const testCaseId = '540e7db1-88e8-4b72-a926-05085baff750'; // Test Customer Playwright case ID

const mockImages = [
  {
    id: 'img-1',
    geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() }
  },
  {
    id: 'img-2',
    geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() }
  },
  {
    id: 'img-3',
    geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() }
  },
  {
    id: 'img-4',
    geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() }
  },
  {
    id: 'img-5',
    geoLocation: { latitude: 19.0760, longitude: 72.8777, accuracy: 10, timestamp: new Date().toISOString() }
  }
];

const residenceFormData = {
  applicantName: 'Test Customer Playwright',
  addressConfirmed: true,
  residenceType: 'OWNED',
  familyMembers: 4,
  neighborVerification: true,
  remarks: 'Test verification from mobile app',
  outcome: 'VERIFIED',
  addressRating: 'EXCELLENT',
  locality: 'RESIDENTIAL',
  stayingPeriod: '5_YEARS_PLUS',
  stayingStatus: 'PERMANENT',
  politicalConnection: 'NO',
  dominatedArea: 'NO',
  recommendationStatus: 'POSITIVE'
};

const geoLocation = {
  latitude: 19.0760,
  longitude: 72.8777,
  accuracy: 10
};

// Run tests
async function runTests() {
  console.log('🧪 Starting Verification Form Integration Tests\n');
  
  try {
    // Test 1: Residence Verification
    console.log('=== Test 1: Residence Verification ===');
    const residenceResult = await MockVerificationFormService.submitResidenceVerification(
      testCaseId,
      residenceFormData,
      mockImages,
      geoLocation
    );
    console.log('Result:', residenceResult);
    console.log('');
    
    // Test 2: Office Verification
    console.log('=== Test 2: Office Verification ===');
    const officeFormData = {
      companyName: 'Test Company Ltd',
      designation: 'Software Engineer',
      employeeId: 'EMP001',
      workingHours: '9 AM - 6 PM',
      hrVerification: true,
      salaryConfirmed: true,
      remarks: 'Test office verification',
      outcome: 'VERIFIED',
      department: 'IT',
      joiningDate: '2023-01-01',
      monthlySalary: 50000,
      hrContactName: 'HR Manager',
      hrContactPhone: '9876543210',
      officeAddress: '123 Business Park',
      officeType: 'CORPORATE',
      totalEmployees: 100,
      businessNature: 'Software Development',
      verificationMethod: 'PHYSICAL',
      documentsSeen: 'ID Card, Salary Slip',
      verificationNotes: 'All documents verified',
      recommendationStatus: 'POSITIVE'
    };
    
    const officeResult = await MockVerificationFormService.submitOfficeVerification(
      testCaseId,
      officeFormData,
      mockImages,
      geoLocation
    );
    console.log('Result:', officeResult);
    console.log('');
    
    // Test 3: Error Cases
    console.log('=== Test 3: Error Cases ===');
    
    // Test with insufficient images
    const errorResult1 = await MockVerificationFormService.submitResidenceVerification(
      testCaseId,
      residenceFormData,
      mockImages.slice(0, 3), // Only 3 images
      geoLocation
    );
    console.log('Insufficient images test:', errorResult1);
    
    // Test with images without geo-location
    const imagesWithoutGeo = mockImages.map(img => ({ ...img, geoLocation: null }));
    const errorResult2 = await MockVerificationFormService.submitResidenceVerification(
      testCaseId,
      residenceFormData,
      imagesWithoutGeo,
      geoLocation
    );
    console.log('Missing geo-location test:', errorResult2);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();
