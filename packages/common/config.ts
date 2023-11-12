export function envString(name: string): string {
  const value = process.env[name];
  if (!value) throw `missing required environment variable ${name}`;

  return value;
}

export function envInt(name: string): number {
  const value = +envString(name);

  if (isNaN(value)) {
    throw `invalid integer for environment variable ${name}=${value}`;
  }

  if (Math.trunc(value) != value) {
    throw `non-integer for environment variable ${name}=${value}`;
  }

  return value;
}
