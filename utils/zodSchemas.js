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

export const expertRegistrationSchema = z.object({
    name: z.string().min(3, { message: 'Name must be at least 3 characters long.' }).max(50, { message: 'Name must be at most 50 characters long.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    mobileNo: z.string().length(10, { message: 'Mobile number must be 10 digits long.' }).regex(/^[6-9]\d{9}$/, { message: 'Please enter a valid mobile number.' }),
    gender: z.enum(["Male", "Female", "Non-Binary", "Other"], {
        required_error: "Gender is required.", invalid_type_error: "Invalid gender selection."
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
        z.string())
        .min(1, { message: 'At least one skill is required.' }),
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
        degree: z.string().min(3, { message: 'Degree must be at least 3 characters long.' }).max(50, { message: 'Degree must be at most 50 characters long.' }),
        field: z.string().min(3, { message: 'Field must be at least 3 characters long.' }).max(50, { message: 'Field must be at most 50 characters long.' }),
        institute: z.string().min(3, { message: 'Institute name must be at least 3 characters long.' }).max(50, { message: 'Institute name must be at most 50 characters long.' }),
        startDate: z.date(),
        endDate: z.date(),
    })), //.min(1, { message: 'At least one education is required.' }),
    linkedin: z.string().url({ message: 'Please enter a valid LinkedIn URL.' }).optional(),
});