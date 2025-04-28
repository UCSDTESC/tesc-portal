import { useRef, useState } from "react";

export default function Profile() {
  const picInput = useRef<HTMLInputElement>(null);
  const [, rerender] = useState({});
  return (
    <div>
      <form action="">
        <input
          type="file"
          accept="image/*"
          ref={picInput}
          className="border border-black rounded-lg cursor-pointer hover:bg-amber-50"
          onChange={() => {
            rerender({});
          }}
        ></input>
        {picInput.current?.files && (
          <img
            src={URL.createObjectURL(picInput.current.files[0])}
            alt=""
            className="w-[40vw]"
          />
        )}
      </form>
    </div>
  );
}
