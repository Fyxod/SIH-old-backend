import { z } from 'zod';

export const adminSchema = z.object({
    username: z.string()
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(50, { message: 'Username must be at most 50 characters long.' }),
    password: z.string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]])[A-Za-z\d!@#$%^&*()_+{}|:;<>,.?/~\-=\[\]]{6,}$/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.' }),
});

export const registerAdminSchema = z.object({
    email: z.string()
        .email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
    confirmPassword: z.string().min(6, { message: 'Confirm password must be at least 6 characters long.' }),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// export const registerSchema = z.object({
//     teamName: z.string()
//         .min(1, { message: "Please enter the team name" })
//         .refine(value => /^[a-zA-Z0-9@\-_\(\). ]+$/.test(value), {
//             message: "Only @ , - , _ , ( , ) , . are allowed as special characters"
//         }),
//     username: z.string()
//         .min(2, { message: "Username should be at least 2 characters long" })
//         .refine(value => /^[a-zA-Z0-9@\-_\(\). ]+$/.test(value), {
//             message: "Only @ , - , _ , ( , ) , . are allowed as special characters"
//         }),
//     email: z.string().email({ message: "Please enter a valid email address" }),
//     password: z.string().min(6, { message: "Password should be atleast 6 characters long" }),
// });

// export const loginSchema = z.object({
//     username: z.string().min(2, { message: "Username is atleast 2 characters long" }),
//     password: z.string().min(6, { message: "Password is atleast 6 characters long" }),
// });



//schemas for expert


export const expertRegistrationSchema = z.object({
    name: z
        .string()
        .min(3, { message: 'Name must be at least 3 characters long.' })
        .max(50, { message: 'Name must be at most 50 characters long.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')),
    email: z.string()
        .email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' }),
    mobileNo: z
        .string()
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' }),
    gender: z.enum(["Male", "Female", "Non-Binary", "Other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }),
    currentPosition: z
        .string()
        .min(3, { message: 'Current position must be at least 3 characters long.' })
        .max(50, { message: 'Current position must be at most 50 characters long.' }),
    currentDepartment: z
        .string()
        .min(3, { message: 'Current department must be at least 3 characters long.' })
        .max(50, { message: 'Current department must be at most 50 characters long.' }),
    skills: z.array(
        z.string()
    ).min(1, { message: 'At least one skill is required.' }),
    bio: z
        .string()
        .max(500, { message: 'Bio must be at most 500 characters long.' })
        .optional(),
    experience: z.array(z.object({
        department: z.string().min(3, { message: 'Department must be at least 3 characters long.' }).max(50, { message: 'Department must be at most 50 characters long.' }),
        position: z.string().min(3, { message: 'Position must be at least 3 characters long.' }).max(50, { message: 'Position must be at most 50 characters long.' }),
        startDate: z.date(),
        endDate: z.date(),
        companyName: z.string().min(2, { message: 'Company name must be at least 2 characters long.' }).max(50, { message: 'Company name must be at most 50 characters long.' }).optional(),
    })), //.min(1, { message: 'At least one experience is required.' }),
    education: z.array(z.object({
        degree: z.string().min(2, { message: 'Degree must be at least 2 characters long.' }).max(50, { message: 'Degree must be at most 50 characters long.' }),
        field: z.string().min(3, { message: 'Field must be at least 3 characters long.' }).max(50, { message: 'Field must be at most 50 characters long.' }),
        institute: z.string().min(3, { message: 'Institute name must be at least 3 characters long.' }).max(50, { message: 'Institute name must be at most 50 characters long.' }),
        startDate: z.date({ message: 'Invalid start date.' }),
        endDate: z.date({ message: 'Invalid end date.' }).optional(),
    })), //.min(1, { message: 'At least one education is required.' }),
    linkedin: z.string().url({ message: 'Please enter a valid LinkedIn URL.' }).optional(),
    resumeToken: z.string().optional(),
});

export const expertLoginSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }),
});

export const expertUpdateSchema = z.object({
    name: z
        .string()
        .min(3, { message: 'Name must be at least 3 characters long.' })
        .max(50, { message: 'Name must be at most 50 characters long.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' '))
        .optional(),
    email: z.string().
        email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' })
        .optional(),
    mobileNo: z
        .string()
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' })
        .optional(),
    gender: z.enum(["Male", "Female", "Non-Binary", "Other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }).optional(),
    currentPosition: z
        .string()
        .min(3, { message: 'Current position must be at least 3 characters long.' })
        .max(50, { message: 'Current position must be at most 50 characters long.' })
        .optional(),
    currentDepartment: z
        .string()
        .min(3, { message: 'Current department must be at least 3 characters long.' })
        .max(50, { message: 'Current department must be at most 50 characters long.' })
        .optional(),
    skills: z.array(
        z.string()
            .trim()
            .min(1, { message: 'Skill must be at least 1 characters long.' })
            .max(40, { message: 'Each skill must be at most 40 characters long.' })
    ).min(1, { message: 'At least one skill is required.' })
        .optional(),
    bio: z
        .string()
        .max(500, { message: 'Bio must be at most 500 characters long.' })
        .optional(),
    experience: z.array(z.object({
        department: z.string().min(3, { message: 'Department must be at least 3 characters long.' }).max(50, { message: 'Department must be at most 50 characters long.' }),
        position: z.string().min(3, { message: 'Position must be at least 3 characters long.' }).max(50, { message: 'Position must be at most 50 characters long.' }),
        startDate: z.date(),
        endDate: z.date(),
        companyName: z.string().min(2, { message: 'Company name must be at least 2 characters long.' }).max(50, { message: 'Company name must be at most 50 characters long.' }).optional(),
    })).optional(),
    education: z.array(z.object({
        degree: z.string().min(2, { message: 'Degree must be at least 2 characters long.' }).max(50, { message: 'Degree must be at most 50 characters long.' }),
        field: z.string().min(3, { message: 'Field must be at least 3 characters long.' }).max(50, { message: 'Field must be at most 50 characters long.' }),
        institute: z.string().min(3, { message: 'Institute name must be at least 3 characters long.' }).max(50, { message: 'Institute name must be at most 50 characters long.' }),
        startDate: z.date(),
        endDate: z.date({ message: 'Invalid end date.' }).optional(),
    })).optional(),
    linkedin: z.string().url({ message: 'Please enter a valid LinkedIn URL.' }).optional(),
    resumeToken: z.string().optional(),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }).optional(),
    confirmPassword: z.string().min(6, { message: 'Confirm password is at least 6 characters long.' }).optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

//schema for candidate 

export const candidateLoginSchema = z.object({
    email: z.string().email({ message: 'Enter a valid email address.' }),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }),
});


export const candidateRegistrationSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long.' })
        .max(50, { message: 'Name must not exceed 50 characters.' })
        .transform((name) => name.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')),
    email: z
        .string()
        .email({ message: 'Please enter a valid email address.' })
        .max(100, { message: 'Email must not exceed 100 characters.' }),
    mobileNo: z
        .string()
        .length(10, { message: 'Mobile number must be 10 digits long.' })
        .regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' }),
    gender: z.enum(["Male", "Female", "Non-Binary", "Other"], {
        required_error: "Gender is required.",
        invalid_type_error: "Invalid gender selection."
    }),
    dateOfBirth: z.date({ message: 'Invalid date of birth.' }),
    skills: z
        .array(z.string().max(30, { message: 'Each skill must not exceed 30 characters.' })),
    bio: z
        .string()
        .max(500, { message: 'Bio must not exceed 500 characters.' })
        .optional(),
    experience: z
        .array(
            z.object({
                position: z
                    .string()
                    .min(2, { message: 'Position must be at least 2 characters long.' })
                    .max(50, { message: 'Position must not exceed 50 characters.' }),
                department: z
                    .string()
                    .min(2, { message: 'Department must be at least 2 characters long.' })
                    .max(50, { message: 'Department must not exceed 50 characters.' }),
                startDate: z.date({ message: 'Invalid start date.' }),
                endDate: z.date({ message: 'Invalid end date.' }).optional(),
                companyName: z
                    .string()
                    .optional()
                    .max(100, { message: 'Company name must not exceed 100 characters.' }),
            })
        ),
    education: z
        .array(
            z.object({
                degree: z
                    .string()
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, { message: 'Degree must not exceed 50 characters.' }),
                institute: z
                    .string()
                    .min(2, { message: 'Institute must be at least 2 characters long.' })
                    .max(100, { message: 'Institute must not exceed 100 characters.' }),
                startDate: z.date({ message: 'Invalid start date.' }),
                endDate: z.date({ message: 'Invalid end date.' }),
            })
        ),
    linkedIn: z
        .string()
        .url({ message: 'Invalid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }),
    confirmPassword: z.string().min(6, { message: 'Confirm password is at least 6 characters long.' }),
    resumeToken: z.string().optional(),
})
    .refine(data => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export const candidateUpdateSchema = z.object({
    name: z
        .string()
        .min(2, { message: 'Name must be at least 2 characters long.' })
        .max(50, { message: 'Name must not exceed 50 characters.' })
        .optional(),
    email: z
        .string()
        .email({ message: 'Invalid email format.' })
        .max(100, { message: 'Email must not exceed 100 characters.' })
        .optional(),
    mobileNo: z
        .string()
        .min(10, { message: 'Mobile number must be at least 10 digits.' })
        .max(15, { message: 'Mobile number must not exceed 15 digits.' })
        .optional(),
    password: z
        .string()
        .min(8, { message: 'Password must be at least 8 characters long.' })
        .max(128, { message: 'Password must not exceed 128 characters.' })
        .optional(),
    dateOfBirth: z.date({ message: 'Invalid date of birth.' }).optional(),
    skills: z
        .array(z.string().max(30, { message: 'Each skill must not exceed 30 characters.' }))
        .optional(),
        bio: z
        .string()
        .max(500, { message: 'Bio must not exceed 500 characters.' })
        .optional(),
    experience: z
        .array(
            z.object({
                position: z
                    .string()
                    .min(2, { message: 'Position must be at least 2 characters long.' })
                    .max(50, { message: 'Position must not exceed 50 characters.' }),
                department: z
                    .string()
                    .min(2, { message: 'Department must be at least 2 characters long.' })
                    .max(50, { message: 'Department must not exceed 50 characters.' }),
                startDate: z.date({ message: 'Invalid start date.' }),
                endDate: z.date({ message: 'Invalid end date.' }).optional(),
                companyName: z
                    .string()
                    .optional()
                    .max(100, { message: 'Company name must not exceed 100 characters.' }),
            })
        )
        .optional(),
    education: z
        .array(
            z.object({
                degree: z
                    .string()
                    .min(2, { message: 'Degree must be at least 2 characters long.' })
                    .max(50, {
                        message: 'Degree must not exceed 50 characters.'
                    }),
                institute: z
                    .string()
                    .min(2, { message: 'Institute must be at least 2 characters long.' })
                    .max(100, { message: 'Institute must not exceed 100 characters.' }),
                startDate: z.date({ message: 'Invalid start date.' }),
                endDate: z.date({ message: 'Invalid end date.' }).optional(),
            })
        )
        .optional(),
    linkedIn: z
        .string()
        .url({ message: 'Invalid LinkedIn URL.' })
        .max(200, { message: 'LinkedIn URL must not exceed 200 characters.' })
        .optional(),
    status: z.enum(["active", "inactive"], { message: 'Status must be either "active" or "inactive".' })
        .optional(),
    resumeToken: z.string().optional(),
    password: z.string().min(6, { message: 'Password is at least 6 characters long.' }).optional(),
    confirmPassword: z.string().min(6, { message: 'Confirm password is at least 6 characters long.' }).optional(),
}).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
});

// schema for subject


export const subjectSchema = z.object({
    title: z.string()
        .min(3, { message: 'Title must be at least 3 characters long.' })
        .max(50, { message: 'Title must be at most 50 characters long.' }),
    description: z.string()
        .min(10, { message: 'Description must be at least 10 characters long.' })
        .max(500, { message: 'Description must be at most 500 characters long.' }),
    department: z.string()
        .min(3, { message: 'Department must be at least 3 characters long.' })
        .max(50, { message: 'Department must be at most 50 characters long.' }),
    type: z.enum(["open", "closed"], {
        required_error: "Type is required.",
        invalid_type_error: "Type must be either 'open' or 'closed'."
    }),
    recommendedSkills: z.array(
        z.string()
            .max(40, { message: 'Each skill must be at most 40 characters long.' })
    ).min(1, { message: 'At least one skill is required.' }),
});

export const subjectUpdateSchema = z.object({
    title: z.string()
        .trim()
        .min(3, { message: 'Title must be at least 3 characters long.' })
        .max(50, { message: 'Title must be at most 50 characters long.' })
        .optional(),
    description: z.string()
        .trim()
        .min(10, { message: 'Description must be at least 10 characters long.' })
        .max(500, { message: 'Description must be at most 500 characters long.' })
        .optional(),
    department: z.string()
        .trim()
        .min(3, { message: 'Department must be at least 3 characters long.' })
        .max(50, { message: 'Department must be at most 50 characters long.' })
        .optional(),
    type: z.enum(["open", "closed"], {
        required_error: "Type is required.",
        invalid_type_error: "Type must be either 'open' or 'closed'."
    }).optional(),
    recommendedSkills: z.array(
        z.string()
            .trim()
            .min(1, { message: 'Skill must be at least 1 characters long.' })
            .max(40, { message: 'Each skill must be at most 40 characters long.' })
    ).min(1, { message: 'At least one skill is required.' })
        .optional(),
    status: z.enum(["open", "closed"], {
        required_error: "Status is required."
    }).optional(),
});