import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, forwardRef, useImperativeHandle } from 'react';

const TiptapEditor = forwardRef(function TiptapEditor({ content, onChange, editable = true }, ref) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: '本文を書く',
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] text-black',
            },
        },
    });

    useImperativeHandle(ref, () => ({
        focus: () => {
            editor?.commands.focus();
        }
    }));

    // Update editor content if external content changes significantly
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            if (editor.getText() === '' && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return <EditorContent editor={editor} />;
});

export default TiptapEditor;
