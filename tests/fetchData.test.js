// fetchData.test.js
import { fetchData } from '../utils/fetchData';
import * as apiModule from '../apiModule';

// Mock the entire module at the beginning of the file
jest.mock('../apiModule', () => ({
  apiCall: jest.fn()
}));

describe('fetchData', () => {
  // Test for successful API call
  it('should correctly retrieve values', async () => {
    const mockData = { id: 1, name: 'Test Item' };
    apiModule.apiCall.mockResolvedValue(mockData); // Override the mock for this test

    const data = await fetchData();
    expect(data).toEqual(mockData);
  });

  // Test for API call failure
  it('should handle API call failure', async () => {
    const errorMessage = 'Network error';
    apiModule.apiCall.mockRejectedValue(new Error(errorMessage)); // Override the mock for this test

    await expect(fetchData()).rejects.toThrow('API call failed');
  });

  // ...more tests...
});
