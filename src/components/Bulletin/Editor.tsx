import { useEffect } from "react";
import { EditorProvider, useCurrentEditor } from "@tiptap/react";

import { extensions } from "../adminUser/Form/EditorExtensions";
import "./editor-styles.css";

function SyncContent({ content }: { content: string }) {
  const { editor } = useCurrentEditor();
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current !== content) {
      editor.commands.setContent(content || "", false);
    }
  }, [content, editor]);
  return null;
}

export default function Editor({ content }: { content: string }) {
  return (
    <EditorProvider
      extensions={extensions}
      editable={false}
      content={content}
      slotAfter={<SyncContent content={content} />}
      editorProps={{
        attributes: {
          class: "mt-5 focus:outline-none min-h-[70vh]",
        },
      }}
    ></EditorProvider>
  );
}
