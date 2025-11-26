import { tags } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { useContext, useEffect, useRef, useState } from "react";
import { Arrow, FilterIcon, SortIcon } from "./svgIcons";
import { useOutsideClicks } from "@lib/hooks/useOutsideClick";
import UserContext from "@lib/UserContext";
import { FaDiamond } from "react-icons/fa6";
import supabase from "@server/supabase";
import { majors } from "@lib/constants";
import { CSVLink } from "react-csv";
export default function CheckBoxes() {
  const { setSearch, People } = useContext(BulletinContext);
  const { User } = useContext(UserContext);
  const filterRef = useRef(null);
  const sortRef = useRef(null);
  const [filterMenu, setFilterMenu] = useState("");
  const [userPoints, setUserPoints] = useState(0);
  useOutsideClicks([filterRef, sortRef], () => setFilterMenu(""));
  useEffect(() => {
    const getUserPoints = async () => {
      if (!User) return;
      if (User.role === "company" || User.role === "") return;
      console.log("------PULLING USER POINTS---------------");
      const { data, error } = await supabase.from("Users").select("points").eq("email", User.email);
      if (data) {
        setUserPoints(data[0].points);
      }
      if (error) {
        console.error(error);
      }
    };
    getUserPoints();
  }, [User]);

  return (
    <form className="p-3 w-full flex gap-2">
      <input
        type="Search"
        placeholder="Search..."
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        className="rounded-lg h-fit p-1 min-w-0 w-20 md:w-fit  focus:outline-none bg-white"
      />
      <div className="flex flex-row gap-3">
        <div
          className="bg-white w-fit flex items-center gap-1 h-full px-2 rounded-2xl relative cursor-pointer indent-[-9999px] md:indent-0"
          ref={filterRef}
          onClick={() => {
            setFilterMenu(filterMenu == "Tags" ? "" : "Tags");
          }}
        >
          <FilterIcon />
          <Arrow />
          <div
            className={`absolute top-9 w-max -left-18/12 bg-white px-2 rounded-lg border border-navy z-100 indent-0 ${
              filterMenu === "Tags" ? "block" : "hidden"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lg:grid lg:grid-cols-[max-content_max-content] flex flex-col gap-2 h-[40vh] max-w-[200px] md:max-w-none">
              <div className=" border-b lg:border-0">
                {User?.role === "company" ? <GradCheckboxes /> : <TagsCheckboxes />}
              </div>
              <div className="h-full overflow-y-scroll">
                {User?.role === "company" ? <MajorsCheckboxes /> : <OrgsCheckboxes />}
              </div>
            </div>
          </div>
        </div>
        <div
          className="bg-white w-fit flex items-center gap-1 h-full px-2 rounded-2xl relative cursor-pointer indent-[-9999px] md:indent-0"
          ref={sortRef}
          onClick={() => {
            setFilterMenu(filterMenu == "Sort" ? "" : "Sort");
          }}
        >
          <SortIcon />
          <Arrow />
          <div
            className={`absolute top-9 -left-1 bg-white px-2 w-max rounded-lg border border-navy z-100 indent-0 ${
              filterMenu === "Sort" ? "block" : "hidden"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <SortCheckboxes
              sortMethodsList={
                User?.role === "company"
                  ? ["Events attended", "First Name (A-Z)", "Last Name (A-Z)"]
                  : ["Most Recent", "Event Name (A-Z)"]
              }
            />
          </div>
        </div>
      </div>
      {User && User.role !== "company" && (
        <div className="bg-white  w-fit flex items-center ml-auto h-full p-1 rounded-2xl relative font-bold gap-1 px-4 text-navy text-xl">
          <FaDiamond className="text-lightBlue" />
          {userPoints}
        </div>
      )}
      {User && User.role === "company" && (
        <CSVLink
          data={People ? People : []}
          className="bg-white w-fit flex items-center ml-auto h-full p-1 rounded-2xl relative gap-1 px-4 text-navy text-md"
        >
          Export csv
        </CSVLink>
      )}
    </form>
  );
}

function TagsCheckboxes() {
  const { setTagFilters, tagFilters } = useContext(BulletinContext);
  return (
    <>
      {tags.map((tag: string) => {
        return (
          <div key={tag} className="flex items-center w-full">
            <input
              type="checkbox"
              id={tag}
              onChange={(e) => {
                if (e.target.checked) {
                  setTagFilters([...tagFilters, tag]);
                } else {
                  setTagFilters(tagFilters.filter((t) => t !== tag));
                }
              }}
            />
            <label htmlFor={tag} className="ml-2">
              {tag}
            </label>
          </div>
        );
      })}
    </>
  );
}

function GradCheckboxes() {
  const { setTagFilters, tagFilters, gradYears } = useContext(BulletinContext);
  return (
    <>
      {gradYears.map((tag: string) => {
        return (
          <div key={tag} className="flex items-center w-full">
            <input
              type="checkbox"
              id={tag}
              onChange={(e) => {
                if (e.target.checked) {
                  setTagFilters([...tagFilters, tag]);
                } else {
                  setTagFilters(tagFilters.filter((t) => t !== tag));
                }
              }}
            />
            <label htmlFor={tag} className="ml-2">
              {tag}
            </label>
          </div>
        );
      })}
    </>
  );
}

function OrgsCheckboxes() {
  const { orgs, orgFilters, setOrgFilters } = useContext(BulletinContext);
  return (
    <>
      {orgs.map((org: string) => {
        return (
          <div key={org} className="flex items-center">
            <input
              type="checkbox"
              id={org}
              onChange={(e) => {
                if (e.target.checked) {
                  setOrgFilters([...orgFilters, org]);
                } else {
                  setOrgFilters(orgFilters.filter((t) => t !== org));
                }
              }}
            />
            <label htmlFor={org} className="ml-2">
              {org}
            </label>
          </div>
        );
      })}
    </>
  );
}

function MajorsCheckboxes() {
  const { orgFilters, setOrgFilters } = useContext(BulletinContext);
  return (
    <>
      {majors.map((org: string) => {
        return (
          <div key={org} className="flex items-center">
            <input
              type="checkbox"
              id={org}
              onChange={(e) => {
                if (e.target.checked) {
                  setOrgFilters([...orgFilters, org]);
                } else {
                  setOrgFilters(orgFilters.filter((t) => t !== org));
                }
              }}
            />
            <label htmlFor={org} className="ml-2">
              {org}
            </label>
          </div>
        );
      })}
    </>
  );
}

function SortCheckboxes({ sortMethodsList }: { sortMethodsList: string[] }) {
  const { setSortMethod } = useContext(BulletinContext);
  return (
    <>
      {sortMethodsList.map((method) => (
        <div key={method} className="flex items-center">
          <input
            type="radio"
            id={method}
            name="sortMethod"
            onChange={(e) => {
              if (e.target.checked) {
                setSortMethod(method);
              }
            }}
          />
          <label htmlFor={method} className="ml-2">
            {method}
          </label>
        </div>
      ))}
    </>
  );
}
