import { useEffect, useState } from "react";
import supabase from "../supabase/supabase";
import { Outlet, useNavigate, NavLink } from "react-router";
import UserContext from "../UserContext";
export default function User() {
  const [User, setUser] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      console.log("fetching user");
      const { data, error } = await supabase.auth.getUser();
      if (data.user?.id) {
        setUser(data.user.id.toString());
      }
      if (error) {
        console.log(error.message);
      }
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut().then(
      () => {
        navigate("/LogIn");
      },
      (error) => {
        console.log(error);
      }
    );
  };

  return (
    <>
      {User && (
        <div className="w-full flex justify-center items-center flex-col p-5">
          {/* header */}
          <span className="w-full h-[10vh] bg-green-200 text-[3vh] flex justify-between items-center px-10 absolute top-0">
            Logged in: {User}
            <NavLink to="/User/">Home</NavLink>
            <NavLink to="/User/Form">Form</NavLink>
            <NavLink to="/User/Data">Data</NavLink>
            <button
              className="rounded-lg border border-black px-5 cursor-pointer h-1/2 right-10 bg-red-400 hover:bg-red-500"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </span>
          <UserContext.Provider value={{ User }}>
            <Outlet />
          </UserContext.Provider>
        </div>
      )}
      {!User && <div className="">Not Logged in!!!</div>}
    </>
  );
}
