import axios from 'axios';
import fs from 'fs';
import config from '../../config/config.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, '../../sampleData/experts.json');
const url = config.BASE_URL + '/expert';

const sendExperts = async () => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const experts = JSON.parse(data);
        const response = await axios.post(config.BASE_URL + '/admin/signin', {
            username: 'superadmin',
            password: 'Pass@123'
            });
        const token = response.data.data.userToken;
        console.log(response.data);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        axios.defaults.headers.common['isMobile'] = 'true';
        const promises = experts.map((expert, index) =>
            axios.post(url, expert)
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
                console.log(`Expert ${result.index}: Successfully posted. Response:`, result.response);
            } else {
                console.error(`Expert ${result.index}: Failed to post. Error:`, result.error);
            }
        });
    } catch (error) {
        console.error('Error reading or processing the JSON file:', error.message);
    }
};

sendExperts();
