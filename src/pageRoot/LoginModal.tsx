import { FormEvent, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { skipMemberProfileSetupPrompt } from "@lib/userProfile";
import { MuiOtpInput } from "mui-one-time-password-input";
import DisplayToast from "@lib/hooks/useToast";
import { motion } from "motion/react";
import { container_login, item } from "@lib/constants";
import EditMemberProfile from "@components/adminUser/Profile/EditMemberProfile";

type LoginModalProps = {
  onclose: () => void;
  initialProfileSetup?: boolean;
};

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20";
const primaryBtnClass =
  "w-full cursor-pointer rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800";

/**
 * Login modal — same auth flows as before (Google member sign-in, recruiter
 * email/password + OTP + password recovery, onboarding profile setup),
 * restyled to the new design system.
 */
export default function LoginModal({ onclose, initialProfileSetup = false }: LoginModalProps) {
  const [register, setRegister] = useState(false);
  const [OTPFlag, setOTPFlag] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotOTPFlag, setForgotOTPFlag] = useState(false);
  const [resetFlag, setResetFlag] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(initialProfileSetup);

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const navigate = useNavigate();

  const {
    Error,
    setError,
    handleSignUp,
    handleSignIn,
    handleGoogleAuth,
    handleVerifyOTP,
    handleSendRecovery,
    handleUpdatePassword,
    loginRecruiterMode,
    setPendingProfileSetup,
    loginModalContext,
    User,
  } = useContext(UserContext);

  useEffect(() => {
    if (initialProfileSetup) {
      setShowProfileSetup(true);
      setPendingProfileSetup(false);
    }
  }, [initialProfileSetup, setPendingProfileSetup]);

  const finishProfileSetup = () => {
    setShowProfileSetup(false);
    onclose();
  };

  const skipProfileSetup = () => {
    if (User?.id) skipMemberProfileSetupPrompt(User.id);
    finishProfileSetup();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const ObjectFormdata = Object.fromEntries(formData.entries());

    if (register) {
      if (ObjectFormdata.password.toString() !== ObjectFormdata.confirmPassword.toString()) {
        DisplayToast("Paswords Don't Match", "error");
        return;
      }
      setEmail(ObjectFormdata.email.toString());
      handleSignUp(
        {
          email: ObjectFormdata.email.toString(),
          password: ObjectFormdata.password.toString(),
        },
        () => setOTPFlag(true),
      );
    } else if (forgot) {
      const emailVal = ObjectFormdata.email.toString();
      setEmail(emailVal);
      handleSendRecovery(emailVal, () => setForgotOTPFlag(true));
    } else {
      handleSignIn(
        {
          email: ObjectFormdata.email.toString(),
          password: ObjectFormdata.password.toString(),
        },
        (result) => {
          if (result?.needsProfileSetup) {
            setShowProfileSetup(true);
          } else {
            onclose();
          }
        },
      );
    }
  };

  const handleOTPSubmit = async () => {
    setError("");
    if (forgotOTPFlag) {
      handleVerifyOTP({ email: email, password: otp, type: "recovery" }, () => {
        setForgotOTPFlag(false);
        setResetFlag(true);
      });
    } else {
      handleVerifyOTP({ email: email, password: otp, type: "email" }, (result) => {
        if (result?.needsProfileSetup) {
          setShowProfileSetup(true);
        } else {
          onclose();
        }
      });
    }
  };

  const handleResetSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setError("");
    if (newPassword !== confirmNewPassword) {
      DisplayToast("Passwords don't match", "error");
      return;
    }
    handleUpdatePassword(newPassword, () => {
      onclose();
      navigate("bulletin");
    });
  };

  const handleBackdropClick = () => {
    if (showProfileSetup) return;
    onclose();
  };

  return (
    <div className="fixed left-0 top-0 z-[100] flex h-screen w-screen items-center justify-center p-4 text-black">
      <div
        className="absolute inset-0 cursor-pointer bg-navy-950/50 backdrop-blur-[2px]"
        onClick={handleBackdropClick}
      />
      <div
        className={`relative z-[1] flex flex-col rounded-3xl bg-white shadow-2xl ${
          showProfileSetup
            ? "h-[90vh] w-[95vw] max-w-5xl min-w-80"
            : "w-full max-w-[460px] px-6 py-8 sm:px-8"
        }`}
      >
        {showProfileSetup ? (
          <div className="flex h-full min-h-0 flex-col p-4 md:p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
              <h1 className="text-xl font-bold tracking-tight text-navy-900 md:text-2xl">
                Welcome to TESC!
              </h1>
              <button
                type="button"
                className="shrink-0 text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                onClick={skipProfileSetup}
              >
                Complete later
              </button>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              <EditMemberProfile mode="onboarding" onComplete={finishProfileSetup} />
            </div>
          </div>
        ) : loginRecruiterMode ? (
          <>
            {OTPFlag || forgotOTPFlag ? (
              <form
                className="flex w-full flex-col items-center justify-center gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOTPSubmit();
                }}
              >
                <h1 className="text-2xl font-bold tracking-tight text-navy-900">
                  Check your Email!
                </h1>
                <p className="hidden w-full text-center text-sm leading-relaxed text-ink-secondary md:block">
                  Please check your <strong>Email</strong> for a one-time 6-digit verification code
                </p>
                <div className="flex w-full justify-center">
                  <MuiOtpInput
                    value={otp}
                    length={6}
                    onChange={(val) => setOtp(val)}
                    className="flex w-full max-w-[420px] !gap-1.5"
                  />
                </div>
                <button type="submit" className={primaryBtnClass}>
                  Submit Code
                </button>
              </form>
            ) : resetFlag ? (
              <motion.form
                variants={container_login}
                initial="hidden"
                animate="show"
                onSubmit={handleResetSubmit}
                className="flex w-full flex-col items-center justify-center gap-4"
              >
                <h1 className="text-2xl font-bold tracking-tight text-navy-900">
                  Set a new password
                </h1>
                <input
                  name="newPassword"
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
                <input
                  name="confirmNewPassword"
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className={inputClass}
                />
                <button type="submit" className={primaryBtnClass}>
                  Submit
                </button>
              </motion.form>
            ) : (
              <motion.form
                variants={container_login}
                initial="hidden"
                animate="show"
                onSubmit={handleSubmit}
                className="flex w-full flex-col items-center justify-center gap-4"
              >
                <motion.h1
                  className="text-center text-2xl font-bold tracking-tight text-navy-900"
                  variants={item}
                >
                  {forgot ? "Reset your password" : "Recruiter Portal"}
                </motion.h1>

                {loginModalContext && !forgot && (
                  <motion.p
                    className="w-full rounded-xl bg-brand-50 px-3 py-2 text-center text-sm text-navy-900"
                    variants={item}
                  >
                    {loginModalContext}
                  </motion.p>
                )}

                <motion.p
                  className="hidden w-full text-center text-sm leading-relaxed text-ink-secondary md:block"
                  variants={item}
                >
                  {forgot ? (
                    "Enter your work email and we'll send you a 6-digit recovery code."
                  ) : (
                    <>
                      Sign in with your <strong>approved work email</strong> to browse the TESC
                      member resume bank.
                    </>
                  )}
                </motion.p>

                <motion.input
                  variants={item}
                  name="email"
                  type="text"
                  placeholder="Work email"
                  className={inputClass}
                  required
                />
                <motion.div
                  variants={item}
                  className={`flex w-full flex-col gap-4 ${forgot ? "hidden" : "block"}`}
                >
                  {!forgot && (
                    <>
                      <input
                        key="password"
                        name="password"
                        type="password"
                        placeholder="Password"
                        className={inputClass}
                        required
                      />
                      {register && (
                        <input
                          name="confirmPassword"
                          type="password"
                          placeholder="Confirm Password"
                          className={inputClass}
                          required
                        />
                      )}
                    </>
                  )}
                </motion.div>

                {Error && <div className="text-sm text-red-600">Error: {Error}</div>}

                {!forgot && (
                  <motion.p className="w-full text-center text-sm text-ink-secondary" variants={item}>
                    Need access? Email{" "}
                    <a
                      href="mailto:contact@tescatucsd.org"
                      className="font-medium text-brand-600 underline-offset-2 hover:underline"
                    >
                      contact@tescatucsd.org
                    </a>
                  </motion.p>
                )}

                <motion.div className="flex w-full items-center justify-between" variants={item}>
                  <button
                    type="button"
                    className="cursor-pointer text-left text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                    onClick={() => {
                      if (forgot) {
                        setForgot(false);
                        setRegister(false);
                        setError("");
                      } else {
                        setRegister(!register);
                        setForgot(false);
                        setError("");
                      }
                    }}
                  >
                    {forgot
                      ? "Back to sign in"
                      : register
                        ? "Already a user? Log in"
                        : "Register a new account"}
                  </button>

                  {!register && !forgot && (
                    <button
                      type="button"
                      className="cursor-pointer text-right text-sm font-medium text-brand-600 underline-offset-2 hover:underline"
                      onClick={() => {
                        setForgot(true);
                        setRegister(false);
                        setError("");
                      }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </motion.div>

                <motion.button variants={item} type="submit" className={primaryBtnClass}>
                  {forgot ? "Send Recovery Code" : register ? "Sign up" : "Sign in"}
                </motion.button>
              </motion.form>
            )}
          </>
        ) : (
          <motion.div
            variants={container_login}
            initial="hidden"
            animate="show"
            className="flex w-full flex-col items-center justify-center gap-5"
          >
            <motion.h1
              className="text-center text-2xl font-bold tracking-tight text-navy-900"
              variants={item}
            >
              Welcome to TESC!
            </motion.h1>

            {loginModalContext && (
              <motion.p
                className="w-full rounded-xl bg-brand-50 px-3 py-2 text-center text-sm text-navy-900"
                variants={item}
              >
                {loginModalContext}
              </motion.p>
            )}

            <motion.p
              className="hidden w-full text-center text-sm leading-relaxed text-ink-secondary md:block"
              variants={item}
            >
              Whether you are a <strong>returning member</strong> or a{" "}
              <strong>new member</strong>, we're glad to have you!
            </motion.p>

            <motion.p className="w-full text-center text-sm text-ink-secondary" variants={item}>
              Sign in with your UCSD Google account.
            </motion.p>

            {Error && <div className="text-sm text-red-600">Error: {Error}</div>}

            <motion.button
              variants={item}
              type="button"
              className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface"
              onClick={() => handleGoogleAuth()}
            >
              <GoogleLogo className="h-5 w-5 shrink-0" />
              Continue with Google
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
