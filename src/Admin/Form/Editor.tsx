import "./editor-styles.css";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";

import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  RedoOutlined,
  UndoOutlined
} from "@ant-design/icons";
import { useCallback } from "react";
import { extensions } from "./EditorExtensions";

export default function Editor({
  content,
  setEditorContent
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
            "border-black border rounded-lg p-3 min-h-[40vh] focus:outline-none max-h-[70vh] overflow-y-scroll"
        }
      }}
    ></EditorProvider>
  );
}

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  if (!editor) {
    return null;
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const addImage = useCallback(() => {
    const url = window.prompt("URL");

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);
  return (
    <div className="bg-amber-100 m-0 rounded-lg">
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
          className={`${
            editor.isActive("bold") ? "bg-amber-200" : ""
          } font-bold`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`${
            editor.isActive("italic") ? "bg-amber-200" : ""
          } italic`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`${
            editor.isActive("strike") ? "bg-amber-200" : ""
          } line-through`}
        >
          Strike
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive("paragraph") ? "bg-amber-200" : ""}
        >
          p
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={
            editor.isActive("heading", { level: 1 }) ? "bg-amber-200" : ""
          }
        >
          h1
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={
            editor.isActive("heading", { level: 2 }) ? "bg-amber-200" : ""
          }
        >
          h2
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={
            editor.isActive("heading", { level: 3 }) ? "bg-amber-200" : ""
          }
        >
          h3
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${editor.isActive("bulletList") ? "bg-amber-200" : ""}`}
        >
          <li className="list-disc"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-amber-200" : ""}
        >
          <li className="list-decimal pl-0 m-0"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={editor.isActive("blockquote") ? "bg-amber-200" : ""}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          Horizontal rule
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
        >
          break
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={
            editor.isActive({ textAlign: "left" }) ? "bg-amber-200" : ""
          }
        >
          <AlignLeftOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={
            editor.isActive({ textAlign: "center" }) ? "bg-amber-200" : ""
          }
        >
          <AlignCenterOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={
            editor.isActive({ textAlign: "right" }) ? "bg-amber-200" : ""
          }
        >
          <AlignRightOutlined />
        </button>
        <button type="button" onClick={addImage}>
          Set image
        </button>
      </div>
    </div>
  );
};
