const API_BASE_URL = 'http://localhost:5000';

export async function calculateRisk(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/calculate-risk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to calculate risk');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function createClaim(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/create-claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('Failed to create claim');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
