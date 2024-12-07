import axios from 'axios';
import fs from 'fs';
import config from '../../config/config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/candidates.json');
const url = config.BASE_URL + '/candidate';

const sendCandidates = async () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const candidates = JSON.parse(data);

        const promises = candidates.map((candidate, index) =>
            axios.post(url, candidate)
                .then(response => ({
                    index: index + 1,
                    success: true,
                    response: response.data
                }))
                .catch(error => ({
                    index: index + 1,
                    success: false,
                    error: error.response ? error.response.data : error.message
                }))
        );

        const results = await Promise.all(promises);

        results.forEach(result => {
            if (result.success) {
                console.log(`Candidate ${result.index}: Successfully posted. Response:`, result.response);
            } else {
                console.error(`Candidate ${result.index}: Failed to post. Error:`, result.error);
            }
        });
    } catch (error) {
        console.error('Error reading or processing the JSON file:', error.message);
    }
};

sendCandidates();
