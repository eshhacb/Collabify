import { useEffect, useRef } from "react";

const CustomEditor = ({ value, onChange }) => {
  const editorRef = useRef(null); //stores the rerfrence to the editor
  const selectionRef = useRef(null);// refrence ot the cursor position

  // Save cursor position before re-render
  const saveCursorPosition = () => {
    const selection = window.getSelection(); //cursor positioon if no text selected
    if (!selection.rangeCount) return; //if range=0 means nothing selected
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(editorRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    selectionRef.current = preSelectionRange.toString().length; // Store cursor position as character offset
  };

  // Restore cursor position after updating content
  const restoreCursorPosition = () => {
    if (selectionRef.current === null || !editorRef.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    let node = editorRef.current;
    let charCount = selectionRef.current;

    function traverseNodes(node) {
      if (charCount <= 0) return node;
      if (node.nodeType === 3) { // Text node
        if (charCount <= node.length) {
          range.setStart(node, charCount);
          range.setEnd(node, charCount);
          charCount = 0;
        } else {
          charCount -= node.length;
        }
      } else {
        for (let child of node.childNodes) {
          node = traverseNodes(child);
          if (charCount <= 0) break;
        }
      }
      return node;
    }

    traverseNodes(node);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  useEffect(() => {
    if (editorRef.current) {
      saveCursorPosition();
      editorRef.current.innerHTML = value;
      restoreCursorPosition();

       // Manually trigger input to ensure AI changes propagate
       const event = new Event("input", { bubbles: true });
       editorRef.current.dispatchEvent(event);//dispatches (fires) the event on editorRef.current
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      saveCursorPosition();
      console.log("CustomEditor onInput triggered with value:", editorRef.current.innerHTML);
      onChange(editorRef.current.innerHTML); 
    }
  };

  return (
    <div
      ref={editorRef}
      contentEditable
      className="w-full h-[80vh] border p-2 rounded-md bg-white shadow-md focus:outline-none"
      onInput={handleInput}
      suppressContentEditableWarning
    />
  );
};

export default CustomEditor;
