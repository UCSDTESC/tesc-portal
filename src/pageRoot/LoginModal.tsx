import { FormEvent, useContext, useState } from "react";

import UserContext from "@lib/UserContext";
import { MuiOtpInput } from "mui-one-time-password-input";
import DisplayToast from "@lib/hooks/useToast";
import { motion } from "motion/react";
import { container_login, item } from "@lib/constants";
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
          <motion.form
            variants={container_login}
            initial="hidden"
            animate="show"
            className=" flex items-center justify-center gap-5 flex-col w-full h-full"
            onSubmit={(e) => {
              e.preventDefault();
              handleOTPSubmit();
            }}
          >
            <motion.h1
              className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]"
              variants={item}
            >
              Check your Email!
            </motion.h1>
            <motion.p
              className="font-DM text-xl w-3/4 text-[#262626] hidden md:block"
              variants={item}
            >
              Please check your <strong>Email</strong> for a one-time 6-digit verification code
            </motion.p>
            <motion.div variants={item}>
              <MuiOtpInput
                value={otp}
                length={6}
                onChange={(e) => setOtp(e)}
                className="rounded-lg w-3/4 !gap-1 flex max-w-[500px]"
              />
            </motion.div>
            <motion.button
              variants={item}
              type="submit"
              className={`cursor-pointer rounded-2xl max-w-[500px]  py-1 px-5 w-3/4 bg-white border border-navy  text-navy font-bold`}
            >
              Register
            </motion.button>
          </motion.form>
        ) : (
          <motion.form
            variants={container_login}
            initial="hidden"
            animate="show"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            className=" flex items-center justify-center gap-5 flex-col w-full h-full"
          >
            <motion.h1
              className="font-DM text-2xl text-navy font-bold [text-shadow:0px_2.83px_2.83px#0000001A]"
              variants={item}
            >
              Welcome to TESC!
            </motion.h1>
            <motion.p
              className="font-DM text-xl w-3/4 text-center text-balance text-[#262626] hidden md:block"
              variants={item}
            >
              Whether you are a <strong>returning member</strong> or a <strong>new member</strong>,
              we're glad to have you!
            </motion.p>
            <motion.input
              variants={item}
              name="email"
              type="text"
              placeholder="✉ UCSD email"
              className=" rounded-lg w-3/4 bg-[#EDEDED] px-1"
            />
            <motion.input
              variants={item}
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
            <motion.div className="w-3/4" variants={item}>
              <button
                type="button"
                className="text-navy cursor-pointer mr-auto underline hover:opacity-80"
                onClick={() => {
                  setRegister(!register);
                }}
              >
                {register ? "Already a user? Log in" : "Register a new account"}
              </button>
            </motion.div>
            <motion.button
              variants={item}
              type="submit"
              className={`cursor-pointer rounded-2xl  py-1 px-5 w-3/4 ${
                register ? "bg-white border border-navy" : "bg-[#6A97BD] border border-[#6A97BD]"
              } text-navy font-bold`}
            >
              {register ? "Sign up" : "Sign in"}
            </motion.button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
