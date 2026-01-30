import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

export default function TiptapEditor({ content, onChange, editable = true }) {
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

    // Update editor content if external content changes significantly (and not focused or initial load)
    // For simple controlled inputs, this can be tricky with Tiptap.
    // Usually better to just initialize. But if we need to load async data:
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if the content is truly different to avoid cursor jumps
            // However, strictly syncing HTML can still be problematic while typing.
            // A common pattern is to only set content if editor is empty or on initial load.
            // For this specific use case (loading diary content), we likely only set it once.
            // We will trust the parent to only pass initial content or manage it carefully.

            // To be safe for the "Edit" use case where content loads later:
            if (editor.getText() === '' && content) {
                editor.commands.setContent(content);
            }
        }
    }, [content, editor]);

    return <EditorContent editor={editor} />;
}
