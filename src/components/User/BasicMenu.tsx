import * as React from "react";
import Button from "@mui/material/Button";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";
import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import MenuItem from "@mui/material/MenuItem";
import MenuList from "@mui/material/MenuList";
import Stack from "@mui/material/Stack";
import { useContext } from "react";
import UserContext from "@lib/UserContext";
import { NavLink } from "react-router";
import { CgProfile } from "react-icons/cg";

export default function BasicMenu() {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const { User, handleSignOut, setShowLoginModal } = useContext(UserContext);
  const isLoggedIn = User && User.id;
  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  function handleListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Tab") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  // return focus to the button when we transitioned from !open -> open
  const prevOpen = React.useRef(open);
  React.useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current?.focus();
    }

    prevOpen.current = open;
  }, [open]);

  const handleLoginClick = () => {
    setOpen(false);
    setShowLoginModal(true);
  };

  return (
    <Stack direction="row" spacing={2}>
      <div>
        <Button
          ref={anchorRef}
          id="composition-button"
          aria-controls={open ? "composition-menu" : undefined}
          aria-expanded={open ? "true" : undefined}
          aria-haspopup="true"
          onClick={handleToggle}
          className="!text-white !text-[3vh] !cursor-pointer !hover:opacity-80 !w-fit !h-fit"
        >
          <CgProfile />
        </Button>
        <Popper
          open={open}
          anchorEl={anchorRef.current}
          role={undefined}
          placement="bottom-end"
          transition
          disablePortal
          className="!mt-2"
        >
          {({ TransitionProps, placement }) => (
            <Grow
              {...TransitionProps}
              style={{
                transformOrigin: placement === "bottom-end" ? "left top" : "left bottom",
              }}
            >
              <Paper>
                <ClickAwayListener onClickAway={handleClose}>
                  <MenuList
                    autoFocusItem={open}
                    id="composition-menu"
                    aria-labelledby="composition-button"
                    onKeyDown={handleListKeyDown}
                  >
                    {isLoggedIn ? (
                      <>
                        {User?.role !== "company" && (
                          <>
                            <NavLink to="/profile">
                              <MenuItem onClick={handleClose}>Profile</MenuItem>
                            </NavLink>
                            <NavLink to="/profile/all-attended-events">
                              <MenuItem onClick={handleClose}>Event History</MenuItem>
                            </NavLink>
                          </>
                        )}
                        {User?.role === "internal" && (
                          <NavLink to="/form">
                            <MenuItem onClick={handleClose}>New Event</MenuItem>
                          </NavLink>
                        )}
                        <MenuItem onClick={handleSignOut}>Logout</MenuItem>
                      </>
                    ) : (
                      <MenuItem onClick={handleLoginClick}>Log in</MenuItem>
                    )}
                  </MenuList>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </div>
    </Stack>
  );
}
