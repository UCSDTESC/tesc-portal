import { Theme, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import OutlinedInput from "@mui/material/OutlinedInput";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Chip from "@mui/material/Chip";
import { Autocomplete, TextField } from "@mui/material";
import { tags } from "@lib/constants";
import { formdata, locations } from "@lib/constants";

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

function getStyles(name: string, personName: readonly string[], theme: Theme) {
  return {
    fontWeight: personName.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular
  };
}

/** Shared outline styling for the MUI inputs, matched to the design system. */
const outlinedInputSx = {
  borderRadius: "0.75rem",
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#e5e9f0" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#2f7fc1" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#2f7fc1",
    borderWidth: "1px",
  },
} as const;

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
      className="w-full"
      sx={{ ...outlinedInputSx, minHeight: "3rem" }}
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
        <Box className="flex flex-wrap gap-2 py-1">
          {selected.map((value: string) => (
            <Chip
              key={value}
              label={value}
              className="!bg-brand-50 font-medium !text-navy-900"
            />
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
      options={locations}
      className="w-full"
      freeSolo
      sx={{
        ...outlinedInputSx,
        "& .MuiOutlinedInput-root": { borderRadius: "0.75rem", minHeight: "3rem" },
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "#2f7fc1",
        },
        "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "#2f7fc1",
        },
      }}
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
