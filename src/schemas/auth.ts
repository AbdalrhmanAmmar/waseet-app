import * as yup from 'yup';

export const loginSchema = yup.object().shape({
  email: yup.string().required('Email address is required').email('Invalid email address'),
  password: yup.string().required('Password is required'),
});

export const signUpSchema = yup.object().shape({
  firstName: yup.string().required('الاسم الأول مطلوب'),
  secondName: yup.string().required('الاسم الثاني مطلوب'),
  lastName: yup.string().required('اسم العائلة مطلوب'),
  email: yup.string().required('البريد الإلكتروني مطلوب').email('بريد إلكتروني غير صالح'),
  phoneNumber: yup.string().required('رقم الهاتف مطلوب'),
  country: yup.string().required('الدولة مطلوبة'),
  city: yup.string().notRequired(),
  oliveryContactMobile: yup.string().notRequired(),
  address: yup.string().required('العنوان مطلوب'),
  birthDate: yup.string().required('تاريخ الميلاد مطلوب'),
  password: yup
    .string()
    .required('كلمة المرور مطلوبة')
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirmPassword: yup
    .string()
    .required('تأكيد كلمة المرور مطلوب')
    .oneOf([yup.ref('password')], 'كلمات المرور غير متطابقة'),
});

export const phoneOnlySchema = yup.object().shape({
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^((10|11|12|15)\d{8}|(5)\d{8})$/, 'Invalid phone number'),
});

export const emailOnlySchema = yup.object().shape({
  email: yup.string().required('Email address is required').email('Invalid email address'),
});

export const otpOnlySchema = yup.object().shape({
  otp: yup.string().required('Verification code is required').length(6, 'Code must be 6 digits'),
});

export const newPasswordSchema = yup.object().shape({
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: yup
    .string()
    .required('Confirm password is required')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

export const profileSchema = yup.object().shape({
  name: yup.string().required('Full name is required'),
  phone: yup
    .string()
    .required('Primary phone is required')
    .min(10, 'Phone must be at least 10 digits'),
  other_phone: yup.string().nullable().notRequired(),
  governorate: yup.string().required('Governorate is required'),
  city: yup.string().required('City is required'),
});
