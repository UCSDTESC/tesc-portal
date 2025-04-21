import { Theme, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { Autocomplete, TextField } from "@mui/material";

import { formdata } from "@lib/constants";
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 2 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};
const tags = [
  "Oliver Hansen",
  "Van Henry",
  "April Tucker",
  "Ralph Hubbard",
  "Omar Alexander",
  "Carlos Abbott",
  "Miriam Wagner",
  "Bradley Wilkerson",
  "Virginia Andrews",
  "Kelly Snyder"
];

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular
  };
}

export function MultipleSelectChip({
  formData,
  handleChange
}: {
  formData: formdata;
  handleChange: (value: string[], cols: string[]) => void;
}) {
  const theme = useTheme();

  return (
    <Select
      labelId="demo-multiple-chip-label"
      id="demo-multiple-chip"
      className="border-black border rounded-lg px-0 h-fit w-full flex text-5xl"
      sx={{ borderRadius: "0.5rem" }}
      multiple
      value={formData.tags}
      onChange={(e) => {
        const {
          target: { value }
        } = e;
        handleChange(typeof value === "string" ? value.split(",") : value, ["tags"]);
      }}
      MenuProps={MenuProps}
      input={<OutlinedInput />}
      renderValue={(selected) => (
        <Box className="flex flex-wrap gap-2">
          {selected.map((value: string) => (
            <Chip key={value} label={value} />
          ))}
        </Box>
      )}
    >
      {tags.map((name) => (
        <MenuItem key={name} value={name} style={getStyles(name, formData.tags, theme)}>
          {name}
        </MenuItem>
      ))}
    </Select>
  );
}

const places = ["asd1", "asd2", "asdasd3"];

export function Dropdown({
  formData,
  handleChange
}: {
  formData: formdata;
  handleChange: (value: string, cols: string[]) => void;
}) {
  return (
    <Autocomplete
      disablePortal
      options={places}
      className="border-black border rounded-lg px-0 h-fit w-full flex text-5xl"
      freeSolo
      sx={{ borderRadius: "0.5rem" }}
      inputValue={formData.location_str}
      onInputChange={(_e, newInputValue) => {
        handleChange(newInputValue, ["location_str"]);
      }}
      value={formData.location_str ? formData.location_str : ""}
      onChange={(_e, newInputValue) => {
        handleChange(newInputValue ? newInputValue : "", ["location_str"]);
      }}
      renderInput={(params) => <TextField {...params} />}
    />
  );
}
