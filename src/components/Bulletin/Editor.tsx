import { EditorProvider } from "@tiptap/react";

import { extensions } from "../adminUser/Form/EditorExtensions";
import "./editor-styles.css";
export default function Editor({ content }: { content: string }) {
  return (
    <EditorProvider
      extensions={extensions}
      editable={false}
      content={content}
      editorProps={{
        attributes: {
          class:
            "border-black border rounded-standard p-5  focus:outline-none min-h-[70vh] overflow-y-scroll"
        }
      }}
    ></EditorProvider>
  );
}
