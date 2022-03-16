// Gets together PE environment variables to send to PE scripts.
export const getPeEnv = () => ({
  DB_HOST: process.env.DB_HOST!,
  PE_DB_NAME: process.env.PE_DB_NAME!,
  PE_DB_USERNAME: process.env.PE_DB_USERNAME!,
  PE_DB_PASSWORD: process.env.PE_DB_PASSWORD!,
  SIXGILL_CLIENT_ID: process.env.SIXGILL_CLIENT_ID!,
  SIXGILL_CLIENT_SECRET: process.env.SIXGILL_CLIENT_SECRET!
});
