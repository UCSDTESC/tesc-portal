import { FormEvent, useContext, useState } from "react";
import { useNavigate } from "react-router";

import UserContext from "@lib/UserContext";
import { MuiOtpInput } from "mui-one-time-password-input";
import DisplayToast from "@lib/hooks/useToast";

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
    handleVerifyOTP,
    handleSendRecovery,
    handleUpdatePassword
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
          password: ObjectFormdata.password.toString()
        },
        () => setOTPFlag(true)
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
          password: ObjectFormdata.password.toString()
        },
        onclose
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
              Please check your <strong>Email</strong> for a one-time 6-digit verification code.
            </p>
            <MuiOtpInput
              value={otp}
              length={6}
              onChange={(val) => setOtp(val)}
              className="rounded-lg w-3/4 !gap-1 flex max-w-[500px]"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-2xl max-w-[500px] py-1 px-5 w-3/4 bg-white border border-navy text-navy font-bold"
            >
              Submit Code
            </button>
          </form>
        ) : resetFlag ? (
          /* ----- RESET PASSWORD AFTER RECOVERY OTP ----- */
          <form
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
          </form>
        ) : (
          /* ----- DEFAULT LOGIN / REGISTER / FORGOT ----- */
          <form
            onSubmit={handleSubmit}
            className="flex items-center justify-center gap-5 flex-col w-full h-full"
          >
            <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A] text-center">
              {forgot
                ? "Reset your password"
                : "Welcome to TESC!"}
            </h1>

            <p className="font-DM text-xl w-3/4 text-center text-balance text-[#262626] hidden md:block">
              {forgot
                ? "Enter your UCSD email and we'll send you a 6-digit recovery code."
                : (
                  <>
                    Whether you are a <strong>returning member</strong> or a{" "}
                    <strong>new member</strong>, we're glad to have you!
                  </>
                )}
            </p>

            {/* always need email */}
            <input
              name="email"
              type="text"
              placeholder="✉ UCSD email"
              className="rounded-lg w-3/4 bg-[#EDEDED] px-1"
              required
            />

            {/* hide password fields in forgot flow */}
            {!forgot && (
              <>
                <input
                  name="password"
                  type="password"
                  placeholder="🔒 Password"
                  className="rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
                  required
                />

                {register && (
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="🔒 Confirm Password"
                    className="rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
                    required
                  />
                )}
              </>
            )}

            {Error && <div className="text-red-600 text-sm">Error: {Error}</div>}

            <div className="w-3/4">
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
                    : (register ? "Already a user? Log in" : "Register a new account")}
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
            </div>

            <button
              type="submit"
              className={`cursor-pointer rounded-2xl py-1 px-5 w-3/4 text-navy font-bold ${
                forgot
                  ? "bg-white border border-navy"
                  : (register
                      ? "bg-white border border-navy"
                      : "bg-[#6A97BD] border border-[#6A97BD]")}
              `}
            >
              {forgot
                ? "Send Recovery Code"
                : (register ? "Sign up" : "Sign in")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
