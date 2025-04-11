import { useEffect, useState } from "react";
import supabase from "../supabase/supabase";
import { Outlet, useNavigate, NavLink } from "react-router";
import UserContext from "../UserContext";
export default function User() {
  const [User, setUser] = useState("");

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

  

  return (
    <>
      {User && (
        <div className="w-full flex justify-center items-center flex-col p-5">
          {/* header */}
          
          <UserContext.Provider value={{ User }}>
            <Outlet />
          </UserContext.Provider>
        </div>
      )}
      {!User && <div className="">Not Logged in!!!</div>}
    </>
  );
}
