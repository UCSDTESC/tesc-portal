import { FormEvent, useContext, useState } from "react";

import UserContext from "@lib/UserContext";
import { MuiOtpInput } from "mui-one-time-password-input";
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
      <div className="w-96 h-3/4 bg-white rounded-lg z-1 flex justify-center">
        {OTPFlag ? (
          <form
            className=" flex items-center justify-center gap-5 flex-col w-full h-full"
            onSubmit={(e) => {
              e.preventDefault();
              handleOTPSubmit();
            }}
          >
            <MuiOtpInput
              value={otp}
              length={6}
              onChange={(e) => setOtp(e)}
              className="rounded-lg w-3/4 !gap-1 flex"
            />
            <button
              type="submit"
              className="cursor-pointer rounded-lg border-black border py-2 px-5 "
            >
              Submit OTP
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
            <input
              name="email"
              type="text"
              placeholder="email"
              className="border border-black rounded-lg w-3/4"
            />
            <input
              name="password"
              type="password"
              placeholder="password"
              className="border border-black rounded-lg w-3/4 "
            />
            {Error && <div className="">Error: {Error}</div>}
            <button
              type="button"
              className="text-red-600 cursor-pointer"
              onClick={() => {
                setRegister(!register);
              }}
            >
              {register ? "Already a user? Log in" : "Register a new account"}
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg border-black border py-2 px-5 "
            >
              {register ? "Register" : "Log in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
