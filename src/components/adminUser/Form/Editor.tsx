import { EditorProvider, useCurrentEditor } from "@tiptap/react";
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  RedoOutlined,
  UndoOutlined
} from "@ant-design/icons";

import { extensions } from "./EditorExtensions";
import "./editor-styles.css";
import { Tooltip } from "@mui/material";
import { Info } from "lucide-react";

const toolbarButtonClass = (active: boolean) =>
  `rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:opacity-40 ${
    active ? "bg-navy-900 text-white" : "text-ink-secondary hover:text-ink"
  }`;

export default function Editor({
  content,
  setEditorContent
}: {
  content: string;
  setEditorContent: (content: string) => void;
}) {
  return (
    <div className="card-shadow overflow-hidden rounded-2xl border border-line bg-white">
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
              "min-h-[40vh] max-h-[70vh] overflow-y-auto p-4 focus:outline-none"
          }
        }}
      ></EditorProvider>
    </div>
  );
}

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  if (!editor) {
    return null;
  }
  return (
    <div className="border-b border-line bg-surface/60 px-2 py-1.5">
      <div className="flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={toolbarButtonClass(false)}
          aria-label="Undo"
        >
          <UndoOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={toolbarButtonClass(false)}
          aria-label="Redo"
        >
          <RedoOutlined />
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`${toolbarButtonClass(editor.isActive("bold"))} font-bold`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`${toolbarButtonClass(editor.isActive("italic"))} italic`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={`${toolbarButtonClass(editor.isActive("strike"))} line-through`}
        >
          Strike
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={toolbarButtonClass(editor.isActive("paragraph"))}
        >
          p
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={toolbarButtonClass(editor.isActive("heading", { level: 1 }))}
        >
          h1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={toolbarButtonClass(editor.isActive("heading", { level: 2 }))}
        >
          h2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={toolbarButtonClass(editor.isActive("heading", { level: 3 }))}
        >
          h3
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={toolbarButtonClass(editor.isActive("bulletList"))}
          aria-label="Bullet list"
        >
          <li className="list-disc ml-5"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={toolbarButtonClass(editor.isActive("orderedList"))}
          aria-label="Numbered list"
        >
          <li className="list-decimal pl-2 ml-5"></li>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={toolbarButtonClass(editor.isActive("blockquote"))}
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={toolbarButtonClass(false)}
        >
          Horizontal rule
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className={toolbarButtonClass(false)}
        >
          break
        </button>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={toolbarButtonClass(editor.isActive({ textAlign: "left" }))}
          aria-label="Align left"
        >
          <AlignLeftOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={toolbarButtonClass(editor.isActive({ textAlign: "center" }))}
          aria-label="Align center"
        >
          <AlignCenterOutlined />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={toolbarButtonClass(editor.isActive({ textAlign: "right" }))}
          aria-label="Align right"
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
                    offset: [0, -14]
                  }
                }
              ]
            }
          }}
        >
          <Info className="ml-1 h-4 w-4 text-ink-muted" />
        </Tooltip>
      </div>
    </div>
  );
};
