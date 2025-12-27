import { Dispatch, SetStateAction } from "react";
import { Box, Stack, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { IoInformationCircleOutline } from "react-icons/io5";
import { DateGroup } from "@lib/constants";

export default function DoubleDateGroup({
  Timeslots,
  setTimeSlots,
}: {
  Timeslots: DateGroup[];
  setTimeSlots: Dispatch<SetStateAction<DateGroup[]>>;
}) {
  const updateGroup = (id: number, field: "startDate" | "endDate", value: string) => {
    setTimeSlots((prev) => prev.map((g) => (g.id === id ? { ...g, [field]: value } : g)));
  };

  const deleteGroup = (id: number) => {
    setTimeSlots((prev) => (prev.length > 1 ? prev.filter((g) => g.id !== id) : prev));
  };

  const addEmptyGroup = () => {
    setTimeSlots((prev) => [...prev, { id: Date.now(), startDate: "", endDate: "" }]);
  };

  return (
    <Stack spacing={2}>
      {Timeslots.map((group) => (
        <Box key={group.id} display="flex" alignItems="center" gap={2}>
          <div className="flex flex-col items-start scroll-smooth">
            <label className=" opacity-75">Start Time</label>
            <input
              type="datetime-local"
              required
              value={group.startDate}
              onChange={(e) => updateGroup(group.id, "startDate", e.target.value)}
              className="border-black border rounded-lg px-3 h-12"
            />
          </div>
          <div className=" flex flex-col items-start scroll-smooth">
            <div className="flex items-center gap-1">
              <label className=" opacity-75">End Time</label>
              <Tooltip
                title={"Event end must be in the future and also after event start"}
                placement="bottom"
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: "offset",
                        options: {
                          offset: [0, -14],
                        },
                      },
                    ],
                  },
                }}
              >
                <IoInformationCircleOutline className="text-sm" />
              </Tooltip>
            </div>
            <div className="">
              <input
                required
                type="datetime-local"
                value={group.endDate}
                min={group.startDate || undefined}
                onChange={(e) => updateGroup(group.id, "endDate", e.target.value)}
                className="border-black border rounded-lg px-3 h-12"
              />
              <IconButton onClick={() => deleteGroup(group.id)}>
                <DeleteIcon />
              </IconButton>
            </div>
          </div>
        </Box>
      ))}

      <button
        type="button"
        onClick={addEmptyGroup}
        className="hover:bg-[#6A97BD] hover:text-white duration-75 border border-[#6A97BD] text-[#6A97BD] w-fit rounded-lg px-5 cursor-pointer flex items-center py-2"
      >
        <AddIcon />
        Add Date Group
      </button>
    </Stack>
  );
}
