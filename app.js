import express from 'express';
import connectMongo from './config/db';
import { server } from './config/config';
import responseHandler from './middlewares/responseHandler';
const app = express();

connectMongo();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler);

app.get('/', (req, res) => {
    res.send('<h1>SIH 2024</h1>');
});


//TEST OUT THIS ERROR JARGON FIRST
app.use((error, req, res, next) => {
    if(error.errors && error.errors[0].message) { // zod error
        error.message = error.errors[0].message;
        error.statusCode = 400;
        error.isOperational = true;
        error.errorCode = 'VALIDATION_ERROR';
    }
    
    if (error.isOperational) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Internal Server Error';
        res.error(statusCode, message, error.errorCode, error.data);
    } else {
        //send email
        //log in a special way maybe
        console.error("ALERT ALERT ALERT");
        console.error('Unhandled error:', error);
        res.error(500, 'Internal Server Error', 'UNHANDLED_ERROR');
        res.status(500).json({ error: 'Something went wrong!' });
    }
});

app.listen(server.port, () => {
    console.log(`Server is running on port ${server.port}`);
});

/*things pending:
1. Decide enums
2. Format all routes
3. Seperate into controllers
4. validate all object ids if coming
5. Add more PATCH routes

/*
Problem Statement Title:
Determining expert relevance with respect to interview board subject and candidates’ area of expertise

Description:
Background: Recruitment and Assessment Centre (RAC) under DRDO, Ministry of Defence conducts interview for recommending candidates
under recruitment, assessment and for sponsorship to acquire higher qualification. Description: The process of conducting 
an interview comprises of selection of board members i.e. experts from DRDO, industry, academia, etc. It is a challenge to
manually match profile of subject experts w.r.t. interview board subject and candidates’ area of expertise.

Expected Solution: 
The solution shall be able to provide a matching score for experts whose domain matches w.r.t. interview board subject and candidates 
area of expertise and thereafter should be able to predict suitability of expert for a particular interview board through a relevancy 
score. To arrive on the relevancy score for an expert the system should be able to determine a profile score for each selected expert 
w.r.t. profile of candidates to be interviewed.

Organization: Ministry of Defence
Department: Defence Research and Devlopment Organisation (DRDO)
Category: Software
Theme: Smart Automation
*/