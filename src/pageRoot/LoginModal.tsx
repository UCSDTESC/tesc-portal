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
    <div className="w-screen h-screen flex justify-center items-center text-black z-100 fixed top-0 left-0">
      <div
        className="w-full h-full bg-black opacity-35 absolute top-0 cursor-pointer"
        onClick={handleBackdropClick}
      />
      <div
        className={`bg-white rounded-lg z-1 flex flex-col ${
          showProfileSetup
            ? "w-[95vw] max-w-5xl h-[90vh] min-w-80"
            : "min-w-80 w-1/2 h-3/4 max-w-[500px] justify-center"
        }`}
      >
        {showProfileSetup ? (
          <div className="flex h-full min-h-0 flex-col p-4 md:p-6">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
              <h1 className="font-DM text-xl font-bold text-navy md:text-2xl">
                Welcome to TESC!
              </h1>
              <button
                type="button"
                className="shrink-0 text-sm text-navy underline hover:opacity-80"
                onClick={skipProfileSetup}
              >
                Complete later
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <EditMemberProfile mode="onboarding" onComplete={finishProfileSetup} />
            </div>
          </div>
        ) : loginRecruiterMode ? (
          <>
            {OTPFlag || forgotOTPFlag ? (
              <form
                className="flex items-center justify-center gap-5 flex-col w-full h-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOTPSubmit();
                }}
              >
                <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
                  Check your Email!
                </h1>
                <p className="font-DM text-xl w-3/4 text-[#262626] hidden md:block">
                  Please check your <strong>Email</strong> for a one-time 6-digit verification code
                </p>
                <div className="w-full flex justify-center">
                  <MuiOtpInput
                    value={otp}
                    length={6}
                    onChange={(val) => setOtp(val)}
                    className="rounded-lg w-3/4 !gap-1 flex max-w-[500px]"
                  />
                </div>
                <button
                  type="submit"
                  className="cursor-pointer rounded-2xl max-w-[500px] py-1 px-5 w-3/4 bg-white border border-navy text-navy font-bold"
                >
                  Submit Code
                </button>
              </form>
            ) : resetFlag ? (
              <motion.form
                variants={container_login}
                initial="hidden"
                animate="show"
                onSubmit={handleResetSubmit}
                className="flex items-center justify-center gap-5 flex-col w-full h-full"
              >
                <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
                  Set a new password
                </h1>
                <input
                  name="newPassword"
                  type="password"
                  placeholder="🔒 New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
                />
                <input
                  name="confirmNewPassword"
                  type="password"
                  placeholder="🔒 Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
                />
                <button
                  type="submit"
                  className="cursor-pointer rounded-2xl max-w-[500px] py-1 px-5 w-3/4 bg-white border border-navy text-navy font-bold"
                >
                  Submit
                </button>
              </motion.form>
            ) : (
              <motion.form
                variants={container_login}
                initial="hidden"
                animate="show"
                onSubmit={handleSubmit}
                className="flex items-center justify-center gap-5 flex-col w-full h-full"
              >
                <motion.h1
                  className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A] text-center"
                  variants={item}
                >
                  {forgot ? "Reset your password" : "Recruiter Portal"}
                </motion.h1>

                {loginModalContext && !forgot && (
                  <motion.p
                    className="font-DM text-sm w-3/4 text-center text-navy bg-blue/10 rounded-lg px-3 py-2"
                    variants={item}
                  >
                    {loginModalContext}
                  </motion.p>
                )}

                <motion.p
                  className="font-DM text-xl w-3/4 text-center text-balance text-[#262626] hidden md:block"
                  variants={item}
                >
                  {forgot ? (
                    "Enter your work email and we'll send you a 6-digit recovery code."
                  ) : (
                    <>
                      Sign in with your <strong>approved work email</strong> to browse the TESC member
                      resume bank.
                    </>
                  )}
                </motion.p>

                <motion.input
                  variants={item}
                  name="email"
                  type="text"
                  placeholder="✉ Work email"
                  className="rounded-lg w-3/4 bg-[#EDEDED] px-1"
                  required
                />
                <motion.div
                  variants={item}
                  className={`w-3/4 gap-5 flex flex-col h-fit ${forgot ? "hidden" : "block"}`}
                >
                  {!forgot && (
                    <>
                      <input
                        key="password"
                        name="password"
                        type="password"
                        placeholder="🔒 Password"
                        className="rounded-lg w-full bg-[#EDEDED] grayscale px-1"
                        required
                      />
                      {register && (
                        <input
                          name="confirmPassword"
                          type="password"
                          placeholder="🔒 Confirm Password"
                          className="rounded-lg w-full bg-[#EDEDED] grayscale px-1"
                          required
                        />
                      )}
                    </>
                  )}
                </motion.div>

                {Error && <div className="text-red-600 text-sm">Error: {Error}</div>}

                {!forgot && (
                  <motion.p className="text-sm text-[#262626] w-3/4 text-center" variants={item}>
                    Need access? Email{" "}
                    <a href="mailto:contact@tescatucsd.org" className="text-navy underline">
                      contact@tescatucsd.org
                    </a>
                  </motion.p>
                )}

                <motion.div className="w-3/4" variants={item}>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-navy cursor-pointer mr-auto underline hover:opacity-80 text-left"
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
                        className="text-navy cursor-pointer underline hover:opacity-80 text-right"
                        onClick={() => {
                          setForgot(true);
                          setRegister(false);
                          setError("");
                        }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.button
                  variants={item}
                  type="submit"
                  className={`cursor-pointer rounded-2xl py-1 px-5 w-3/4 text-navy font-bold ${
                    forgot || register
                      ? "bg-white border border-navy"
                      : "bg-[#6A97BD] border border-[#6A97BD]"
                  }`}
                >
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
            className="flex h-full w-full flex-col items-center justify-center gap-5"
          >
            <motion.h1
              className="font-DM text-center text-2xl font-bold text-navy [text-shadow:0px_2.83px_2.83px#0000001A]"
              variants={item}
            >
              Welcome to TESC!
            </motion.h1>

            {loginModalContext && (
              <motion.p
                className="font-DM w-3/4 rounded-lg bg-blue/10 px-3 py-2 text-center text-sm text-navy"
                variants={item}
              >
                {loginModalContext}
              </motion.p>
            )}

            <motion.p
              className="font-DM hidden w-3/4 text-center text-xl text-balance text-[#262626] md:block"
              variants={item}
            >
              Whether you are a <strong>returning member</strong> or a <strong>new member</strong>,
              we're glad to have you!
            </motion.p>

            <motion.p className="w-3/4 text-center text-sm text-[#262626]" variants={item}>
              Sign in with your UCSD Google account.
            </motion.p>

            {Error && <div className="text-sm text-red-600">Error: {Error}</div>}

            <motion.button
              variants={item}
              type="button"
              className="flex w-3/4 max-w-[500px] cursor-pointer items-center justify-center gap-3 rounded-2xl border border-gray-300 bg-white px-5 py-2.5 text-base font-semibold text-[#1f1f1f] hover:bg-gray-50"
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
