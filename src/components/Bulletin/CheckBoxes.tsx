import { tags } from "@lib/constants";
import { BulletinContext } from "@lib/hooks/useBulletin";
import { useContext } from "react";

export default function CheckBoxes() {
  const { setSearch } = useContext(BulletinContext);
  return (
    <form className="p-3">
      <input
        type="Search"
        placeholder="Search"
        onChange={(e) => {
          setSearch(e.target.value);
        }}
        className=" border rounded-standard p-1 focus:outline-none"
      />
      <div className="flex flex-row gap-3">
        <div>
          <TagsCheckboxes />
        </div>
        <div className="max-h-[10rem] overflow-scroll">
          <OrgsCheckboxes />
        </div>
      </div>
    </form>
  );
}

function TagsCheckboxes() {
  const { tagFilters, setTagFilters } = useContext(BulletinContext);
  return (
    <>
      {tags.map((tag: string) => {
        return (
          <div className="flex items-center">
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
          <div className="flex items-center">
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
