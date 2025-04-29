import { useRef, useState } from "react";

export default function NewProfile() {
  const picInput = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("");
  const imageUpload = () => {
    if (!picInput.current?.files) return;
    if (picInput.current.files[0].size > 2097152) {
      alert("File is too big");
      picInput.current.value = "";
    } else {
      setImage(URL.createObjectURL(picInput.current.files[0]));
    }
  };
  const formSubmit = () => {};
  return (
    <div>
      <form action="" onSubmit={formSubmit}>
        <input
          type="file"
          accept="image/*"
          ref={picInput}
          className="border border-black rounded-lg cursor-pointer hover:bg-amber-50"
          onChange={imageUpload}
        ></input>
        {picInput.current?.files && (
          <img
            src={image}
            alt=""
            className="w-[5vw] aspect-square object-cover rounded-full"
          />
        )}
        <button
          type="submit"
          className="border border-black rounded-lg px-2 py-1 hover:bg-amber-100 cursor-pointer"
        >
          Add new Profile Picture
        </button>
      </form>
    </div>
  );
}
