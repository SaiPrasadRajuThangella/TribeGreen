export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>; // first message per field, e.g. { "address.pincode": "…" }
  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}
