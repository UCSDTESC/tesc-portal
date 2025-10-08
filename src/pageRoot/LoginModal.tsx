import { FormEvent, useContext, useState } from "react";

import UserContext from "@lib/UserContext";
import { MuiOtpInput } from "mui-one-time-password-input";
import DisplayToast from "@lib/hooks/useToast";
export default function LoginModal({ onclose }: { onclose: () => void }) {
  const [register, setRegister] = useState(false);
  const [OTPFlag, setOTPFlag] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const { Error, setError, handleSignUp, handleSignIn, handleVerifyOTP } = useContext(UserContext);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setError("");
    const formData = new FormData(event.currentTarget);
    const ObjectFormdata = Object.fromEntries(formData.entries());
    if (register) {
      if (ObjectFormdata.password.toString() != ObjectFormdata.confirmPassword.toString()) {
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
    } else {
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
    handleVerifyOTP({ email: email, password: otp, type: "email" }, onclose);
  };
  return (
    <div className="w-screen h-screen flex justify-center items-center text-black z-100 fixed top-0 left-0">
      <div
        className="w-full h-full bg-black opacity-35 absolute top-0 cursor-pointer"
        onClick={onclose}
      />
      <div className="min-w-80 w-1/2 h-3/4 max-w-[500px] bg-white rounded-lg z-1 flex justify-center">
        {OTPFlag ? (
          <form
            className=" flex items-center justify-center gap-5 flex-col w-full h-full"
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
            <MuiOtpInput
              value={otp}
              length={6}
              onChange={(e) => setOtp(e)}
              className="rounded-lg w-3/4 !gap-1 flex max-w-[500px]"
            />
            <button
              type="submit"
              className={`cursor-pointer rounded-2xl max-w-[500px]  py-1 px-5 w-3/4 bg-white border border-navy  text-navy font-bold`}
            >
              Register
            </button>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className=" flex items-center justify-center gap-5 flex-col w-full h-full"
          >
            <h1 className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]">
              Welcome to TESC!
            </h1>
            <p className="font-DM text-xl w-3/4 text-center text-balance text-[#262626] hidden md:block">
              Whether you are a <strong>returning member</strong> or a <strong>new member</strong>,
              we're glad to have you!
            </p>
            <input
              name="email"
              type="text"
              placeholder="✉ UCSD email"
              className=" rounded-lg w-3/4 bg-[#EDEDED] px-1"
            />
            <input
              name="password"
              type="password"
              placeholder="🔒 Password"
              className=" rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
            />
            {register && (
              <input
                name="confirmPassword"
                type="password"
                placeholder="🔒 Confirm Password"
                className=" rounded-lg w-3/4 bg-[#EDEDED] grayscale px-1"
              />
            )}
            {Error && <div className="">Error: {Error}</div>}
            <div className="w-3/4">
              <button
                type="button"
                className="text-navy cursor-pointer mr-auto underline hover:opacity-80"
                onClick={() => {
                  setRegister(!register);
                }}
              >
                {register ? "Already a user? Log in" : "Register a new account"}
              </button>
            </div>
            <button
              type="submit"
              className={`cursor-pointer rounded-2xl  py-1 px-5 w-3/4 ${
                register ? "bg-white border border-navy" : "bg-[#6A97BD] border border-[#6A97BD]"
              } text-navy font-bold`}
            >
              {register ? "Sign up" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
