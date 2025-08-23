import { ExperimentResult } from './types';

export async function saveExperimentData(data: ExperimentResult): Promise<boolean> {
    try {
        const response = await fetch('/api/save-experiment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }
            console.error('API Error Response:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Experiment data saved successfully:', result);
        return true;

    } catch (error) {
        console.error('Error saving experiment data:', error);
        return false;
    }
}
