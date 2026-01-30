import { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { MuiOtpInput } from "mui-one-time-password-input";
import DisplayToast from "@lib/hooks/useToast";
import { motion } from "motion/react";
import { container_login, item } from "@lib/constants";
export default function LoginModal({ onclose }: { onclose: () => void }) {
  const [register, setRegister] = useState(false);
  const [OTPFlag, setOTPFlag] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotOTPFlag, setForgotOTPFlag] = useState(false);
  const [resetFlag, setResetFlag] = useState(false);

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
    handleSignInWithGoogle,
    handleVerifyOTP,
    handleSendRecovery,
    handleUpdatePassword,
  } = useContext(UserContext);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const ObjectFormdata = Object.fromEntries(formData.entries());

    if (register) {
      // signup flow
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
      // forgot password flow (send recovery OTP)
      const emailVal = ObjectFormdata.email.toString();
      setEmail(emailVal);
      handleSendRecovery(emailVal, () => setForgotOTPFlag(true));
    } else {
      // normal login
      handleSignIn(
        {
          email: ObjectFormdata.email.toString(),
          password: ObjectFormdata.password.toString(),
        },
        onclose,
      );
    }
  };

  const handleOTPSubmit = async () => {
    setError("");
    if (forgotOTPFlag) {
      // recovery OTP
      handleVerifyOTP({ email: email, password: otp, type: "recovery" }, () => {
        setForgotOTPFlag(false);
        setResetFlag(true);
      });
    } else {
      // registration OTP
      handleVerifyOTP({ email: email, password: otp, type: "email" }, onclose);
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

  return (
    <div className="w-screen h-screen flex justify-center items-center text-black z-100 fixed top-0 left-0">
      <div
        className="w-full h-full bg-black opacity-35 absolute top-0 cursor-pointer"
        onClick={onclose}
      />
      <div className="min-w-80 w-1/2 h-3/4 max-w-[500px] bg-white rounded-lg z-1 flex justify-center">
        {/* ----- OTP ENTRY (signup or recovery) ----- */}
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
          /* ----- RESET PASSWORD AFTER RECOVERY OTP ----- */
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
          /* ----- DEFAULT LOGIN / REGISTER / FORGOT ----- */
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
              {forgot ? "Reset your password" : "Welcome to TESC!"}
            </motion.h1>

            <motion.p
              className="font-DM text-xl w-3/4 text-center text-balance text-[#262626] hidden md:block"
              variants={item}
            >
              {forgot ? (
                "Enter your UCSD email and we'll send you a 6-digit recovery code."
              ) : (
                <>
                  Whether you are a <strong>returning member</strong> or a{" "}
                  <strong>new member</strong>, we're glad to have you!
                </>
              )}
            </motion.p>

            {/* always need email */}
            <motion.input
              variants={item}
              name="email"
              type="text"
              placeholder="✉ UCSD email"
              className="rounded-lg w-3/4 bg-[#EDEDED] px-1"
              required
            />
            <motion.div
              variants={item}
              className={`w-3/4 gap-5 flex flex-col h-fit ${forgot ? "hidden" : "block"}`}
            >
              {/* hide password fields in forgot flow */}
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

            <motion.div className="w-3/4" variants={item}>
              <div className="flex items-center justify-between">
                {/* left link: register toggle OR back-to-login */}
                <button
                  type="button"
                  className="text-navy cursor-pointer mr-auto underline hover:opacity-80 text-left"
                  onClick={() => {
                    if (forgot) {
                      // leave forgot mode -> go back to sign in
                      setForgot(false);
                      setRegister(false);
                      setError("");
                    } else {
                      // toggle register vs login
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

                {/* right link: forgot password (only show on login) */}
                {!register && !forgot && (
                  <button
                    type="button"
                    className="text-navy cursor-pointer underline hover:opacity-80 text-right"
                    onClick={() => {
                      // switch to forgot password flow
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
                forgot
                  ? "bg-white border border-navy"
                  : register
                    ? "bg-white border border-navy"
                    : "bg-[#6A97BD] border border-[#6A97BD]"
              }
              `}
            >
              {forgot ? "Send Recovery Code" : register ? "Sign up" : "Sign in"}
            </motion.button>

            {/* Google Sign In Button - only show on login/register, not forgot password */}
            {!forgot && (
              <motion.div className="w-3/4 flex flex-col items-center gap-2" variants={item}>
                <div className="flex items-center w-full gap-2">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="text-sm text-gray-500 px-2">or</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    handleSignInWithGoogle();
                  }}
                  className="w-full flex items-center justify-center gap-3 cursor-pointer rounded-2xl py-2 px-5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>
              </motion.div>
            )}
          </motion.form>
        )}
      </div>
    </div>
  );
}
