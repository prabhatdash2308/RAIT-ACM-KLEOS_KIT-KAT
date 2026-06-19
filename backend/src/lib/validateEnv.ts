const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'AES_ENCRYPTION_KEY'] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]?.trim());
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if ((process.env.AES_ENCRYPTION_KEY?.length ?? 0) !== 32) {
    console.error(`AES_ENCRYPTION_KEY must be exactly 32 characters (got ${process.env.AES_ENCRYPTION_KEY?.length ?? 0})`);
    process.exit(1);
  }

  if (process.env.DATABASE_URL?.includes('-pooler.')) {
    console.error(
      'DATABASE_URL uses Neon pooler (-pooler in hostname). Use the DIRECT connection string from Neon (without -pooler).'
    );
    process.exit(1);
  }

  console.log(`Starting on PORT=${process.env.PORT || process.env.BACKEND_PORT || '4000'}`);
}
