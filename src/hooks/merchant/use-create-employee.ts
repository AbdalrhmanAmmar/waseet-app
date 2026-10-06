import { useRef, useState } from 'react';
import { createMerchantEmployee } from '@/api/merchant/employees';
import { useSession } from '@/hooks/shared/use-session';
import { employeeErrors, employeeInput, type EmployeeForm } from '@/domain/merchant-employee';
import type { ApiError } from '@/types/models';
export const emptyEmployee: EmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};
export function useCreateEmployee() {
  const { role, restricted } = useSession();
  const [form, setForm] = useState<EmployeeForm>({ ...emptyEmployee });
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null);
  const lock = useRef(false);
  const errors = employeeErrors(form);
  async function submit() {
    if (lock.current || uncertain || created || role !== 'Merchant' || restricted) return;
    setSubmitted(true);
    if (Object.keys(errors).length) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const input = employeeInput(form);
      await createMerchantEmployee(input);
      setCreated({ name: `${input.firstName} ${input.lastName}`, email: input.email });
      setForm({ ...emptyEmployee });
    } catch (e) {
      const failure = e as ApiError;
      const unknown =
        typeof failure.status !== 'number' || failure.status >= 500 || failure.status === 408;
      setUncertain(unknown);
      setError(
        unknown
          ? 'تعذر التأكد من نتيجة إنشاء الحساب. تحقق مع الدعم قبل إعادة المحاولة.'
          : failure.message || 'تعذر إنشاء الحساب',
      );
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  return {
    form,
    setForm,
    errors: submitted ? errors : {},
    busy,
    error,
    uncertain,
    created,
    submit,
    reset: () => {
      setCreated(null);
      setForm({ ...emptyEmployee });
      setSubmitted(false);
      setError('');
    },
  };
}
