export const OTP_COOLDOWN_MS = 60000;
export const REQUEST_MESSAGE =
  "If this address can receive a code, check your inbox. You can try again after one minute.";
export type AuthPort = {
  signInWithOtp: (input: {
    email: string;
    options: { shouldCreateUser: boolean; captchaToken?: string };
  }) => Promise<{ error: unknown }>;
  verifyOtp: (input: {
    email: string;
    token: string;
    type: "email";
  }) => Promise<{ error: unknown }>;
};
export async function requestCode(
  auth: AuthPort,
  email: string,
  register: boolean,
  now: number,
  nextAllowed: number,
  captchaToken?: string,
) {
  if (now < nextAllowed)
    throw Error("Please wait before requesting another code.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254)
    throw Error("Enter a valid email address.");
  // No account-existence details reach the UI. Verification is always provider-side.
  try {
    await auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: register,
        ...(captchaToken ? { captchaToken } : {}),
      },
    });
  } catch {}
  return { message: REQUEST_MESSAGE, nextAllowed: now + OTP_COOLDOWN_MS };
}
export async function verifyCode(auth: AuthPort, email: string, token: string) {
  if (!token.trim()) throw Error("Enter the code from your email.");
  const { error } = await auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });
  if (error)
    throw Error(
      "The code could not be verified. Check it or request a new one.",
    );
}
