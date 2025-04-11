import { FormEvent, useContext, useState } from "react";
import UserContext from "../UserContext";
export default function LoginModal({ onclose }: { onclose: () => void }) {
  const [register, setRegister] = useState(false);
  const { Error, setError, handleSignUp, handleSignIn } =
    useContext(UserContext);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setError("");
    const formData = new FormData(event.currentTarget);
    const ObjectFormdata = Object.fromEntries(formData.entries());
    if (register) {
      handleSignUp(
        {
          email: ObjectFormdata.email.toString(),
          password: ObjectFormdata.password.toString(),
        },
        onclose
      );
    } else {
      handleSignIn(
        {
          email: ObjectFormdata.email.toString(),
          password: ObjectFormdata.password.toString(),
        },
        onclose
      );
    }
  };
  return (
    <div className="w-screen h-screen flex justify-center items-center text-black z-100 fixed top-0 left-0">
      <div
        className="w-full h-full bg-black opacity-35 absolute top-0 cursor-pointer"
        onClick={onclose}
      />
      <div className="w-96 h-3/4 bg-white rounded-lg z-1 flex justify-center">
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
      </div>
    </div>
  );
}
