import "./editor-styles.css";
import { EditorProvider } from "@tiptap/react";
import { extensions } from "../adminUser/Form/EditorExtensions";
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
