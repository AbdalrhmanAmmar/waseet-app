export type EmployeeForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type EmployeeInput = Omit<EmployeeForm, 'confirmPassword'>;
export function employeeErrors(form: EmployeeForm): Partial<Record<keyof EmployeeForm, string>> {
  const errors: Partial<Record<keyof EmployeeForm, string>> = {};
  if (!form.firstName.trim()) errors.firstName = 'أدخل الاسم الأول';
  if (!form.lastName.trim()) errors.lastName = 'أدخل اسم العائلة';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
    errors.email = 'أدخل بريدًا إلكترونيًا صحيحًا';
  if (!form.password.trim()) errors.password = 'أدخل كلمة المرور';
  if (!form.confirmPassword || form.password !== form.confirmPassword)
    errors.confirmPassword = 'كلمتا المرور غير متطابقتين';
  return errors;
}
export function employeeInput(form: EmployeeForm): EmployeeInput {
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
  };
}
