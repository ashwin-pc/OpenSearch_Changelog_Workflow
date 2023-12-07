// fetchData.js
import { apiCall } from '../apiModule';

export const fetchData = async () => {
    try {
        const data = await apiCall();
        return data;
    } catch (error) {
        throw new Error('API call failed');
    }
};
