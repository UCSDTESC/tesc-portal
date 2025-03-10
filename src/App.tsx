import { FormEvent, useState } from "react";
import supabase from "./supabase/supabase";
import { useNavigate } from "react-router";
function App() {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    setError("");
    const formData = new FormData(event.currentTarget);
    const ObjectFormdata = Object.fromEntries(formData.entries());
    if (register) {
      const { data, error } = await supabase.auth.signUp({
        email: ObjectFormdata.email.toString(),
        password: ObjectFormdata.password.toString(),
      });
      if (data.user) {
        await supabase
          .from("Users")
          .insert({ UID: data.user?.id, Email: data.user?.email })
          .then(
            () => {
              setError("");
              navigate("/User");
            },
            (error) => {
              console.log(error);
            }
          );
      }
      if (error) {
        setError(error.message);
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ObjectFormdata.email.toString(),
        password: ObjectFormdata.password.toString(),
      });
      if (data.user) {
        console.log(data);
        setError("");
        navigate("/User");
      }
      if (error) {
        setError(error.message);
      }
    }
  };
  return (
    <>
      <div className="w-screen h-screen flex flex-col justify-center items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="border border-black flex items-center gap-5 flex-col w-1/3 h-1/2"
        >
          <input
            name="email"
            type="text"
            placeholder="email"
            className="border border-black rounded-lg w-3/4 mt-[20%] "
          />
          <input
            name="password"
            type="password"
            placeholder="password"
            className="border border-black rounded-lg w-3/4 "
          />
          {error && <div className="">Error: {error}</div>}
          <button
            type="submit"
            className="cursor-pointer rounded-lg border-black border py-2 px-5 "
          >
            {register ? "Register" : "Log in"}
          </button>
          <button
            type="button"
            className="text-red-600 cursor-pointer"
            onClick={() => {
              setRegister(!register);
            }}
          >
            {register ? "Already a user? Log in" : "Register a new account"}
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
