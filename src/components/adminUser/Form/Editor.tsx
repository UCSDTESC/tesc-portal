import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  RedoOutlined,
  UndoOutlined,
} from "@ant-design/icons";

import { extensions } from "./EditorExtensions";
import "./editor-styles.css";
import { Tooltip } from "@mui/material";
import { IoInformationCircleOutline } from "react-icons/io5";

export default function Editor({
  content,
  setEditorContent,
}: {
  content: string;
  setEditorContent: (content: string) => void;
}) {
  return (
    <EditorProvider
      onUpdate={(e) => {
        setEditorContent(e.editor.getHTML());
      }}
      slotBefore={<MenuBar />}
      extensions={extensions}
      content={content}
      editorProps={{
        attributes: {
          class:
            "border-black border rounded-lg p-3 min-h-[40vh] focus:outline-none max-h-[70vh] overflow-y-scroll",
        },
      }}
    ></EditorProvider>
  );
}

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  if (!editor) {
    return null;
  }
  return (
    <div className=" m-0 rounded-lg">
      <div className="button-group [&>button]:m-1 [&>button]:border [&>button]:border-black [&>button]:rounded-lg [&>button]:px-2 [&>button]:hover:cursor-pointer">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
        >
          <UndoOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
        >
          <RedoOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`${editor.isActive("bold") ? "bg-blue/40" : ""} font-bold`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`${editor.isActive("italic") ? "bg-blue/40" : ""} italic`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`${editor.isActive("strike") ? "bg-blue/40" : ""} line-through`}
        >
          Strike
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "bg-blue/40" : ""}
        >
          p
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-blue/40" : ""}
        >
          h1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-blue/40" : ""}
        >
          h2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "bg-blue/40" : ""}
        >
          h3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${editor.isActive("bulletList") ? "bg-blue/40" : ""}`}
        >
          <li className="list-disc ml-5"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-blue/40" : ""}
        >
          <li className="list-decimal pl-2 ml-5"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-blue/40" : ""}
        >
          Quote
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          Horizontal rule
        </button>
        <button type="button" onClick={() => editor.chain().focus().setHardBreak().run()}>
          break
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={editor.isActive({ textAlign: "left" }) ? "bg-blue/40" : ""}
        >
          <AlignLeftOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={editor.isActive({ textAlign: "center" }) ? "bg-blue/40" : ""}
        >
          <AlignCenterOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={editor.isActive({ textAlign: "right" }) ? "bg-blue/40" : ""}
        >
          <AlignRightOutlined />
        </button>

        <Tooltip
          title={
            "Use this Contents box to customize the text that will be displayed under the poster on the bulletin posting. In the future, there are also plans to allow export functionality for use in weekly newsletters"
          }
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
          <IoInformationCircleOutline className="text-2xl" />
        </Tooltip>
      </div>
    </div>
  );
};
