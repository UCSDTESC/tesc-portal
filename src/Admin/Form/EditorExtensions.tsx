import BulletList from "@tiptap/extension-bullet-list";
// import { Color } from "@tiptap/extension-color";
// import ListItem from "@tiptap/extension-list-item";
import OrderedList from "@tiptap/extension-ordered-list";
import TextStyle from "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
export const extensions = [
  TextStyle.configure(),
  TextAlign.configure({
    types: ["heading", "paragraph"]
  }),
  StarterKit,
  Image.configure({
    HTMLAttributes: {
      class: "w-1/2 aspect-square object-contain ml-2"
    },
    inline: true
  }),
  Placeholder,

  BulletList.configure({
    HTMLAttributes: {
      class: "list-disc"
    }
  }),
  OrderedList.configure({
    HTMLAttributes: {
      class: "list-decimal"
    }
  })
];
