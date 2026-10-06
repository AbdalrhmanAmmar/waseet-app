import { client } from '../client';
import type { EmployeeInput } from '@/domain/merchant-employee';
// Credentials and response never enter the RTK Query cache or the login/session flow.
export async function createMerchantEmployee(input: EmployeeInput): Promise<void> {
  await client.post('user/merchant-employee', {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    password: input.password,
  });
}
