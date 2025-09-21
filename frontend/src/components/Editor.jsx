import { useEffect, useState, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import axios from "axios";
import { debounce } from "lodash";
import CustomEditor from "./CustomEditor"; 
import CodeEditor from "./CodeEditor"; 
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import TitleIcon from "@mui/icons-material/Title";
import LinkIcon from "@mui/icons-material/Link";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import SuperscriptIcon from "@mui/icons-material/Superscript";
import SubscriptIcon from "@mui/icons-material/Subscript";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import FormatClearIcon from "@mui/icons-material/FormatClear";
import FormatIndentDecreaseIcon from "@mui/icons-material/FormatIndentDecrease";
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import CodeIcon from "@mui/icons-material/Code";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import FormatColorTextIcon from "@mui/icons-material/FormatColorText";
import FormatColorFillIcon from "@mui/icons-material/FormatColorFill";
import { getDocumentById } from "../api/documentService";
import { config } from "../config.js";

const API_BASE_URL = config.API_URL;
const SOCKET_URL = config.SOCKET_URL;

// Initialize socket to collaboration service
const socket = io(SOCKET_URL, { transports: ["websocket", "polling"], withCredentials: true });

const Editor = ({ documentId, onContentChange, externalContent  }) => {
  // Keep doc editor and code editor content separate
  const [docContent, setDocContent] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [documentTitle, setDocumentTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState(null); // viewer | editor | admin
  const [isCodeMode, setIsCodeMode] = useState(false);

  // Load persisted editor mode from localStorage per document
  useEffect(() => {
    if (!documentId) return;
    try {
      const saved = localStorage.getItem(`editorMode:${documentId}`);
      if (saved === 'code') setIsCodeMode(true);
      if (saved === 'normal') setIsCodeMode(false);
    } catch {}
  }, [documentId]);

  // Load persisted code content per document from localStorage
  useEffect(() => {
    if (!documentId) return;
    try {
      const savedCode = localStorage.getItem(`codeContent:${documentId}`);
      if (savedCode !== null) setCodeContent(savedCode);
    } catch {}
  }, [documentId]);

  // Persist editor mode on change
  useEffect(() => {
    if (!documentId) return;
    try {
      localStorage.setItem(`editorMode:${documentId}`, isCodeMode ? 'code' : 'normal');
    } catch {}
  }, [documentId, isCodeMode]);

  // Persist code content on change
  useEffect(() => {
    if (!documentId) return;
    try {
      localStorage.setItem(`codeContent:${documentId}`, codeContent ?? "");
    } catch {}
  }, [documentId, codeContent]);

  // Fetch role from document service
  useEffect(() => {
    if (!documentId) return;
    getDocumentById(documentId)
      .then(({ document, userRole }) => {
        setUserRole(userRole);
        if (document?.title) setDocumentTitle(document.title);
      })
      .catch((err) => {
        console.error("Error fetching document role/title:", err);
      });
  }, [documentId]);

  useEffect(() => {
    if (!documentId) return;

    socket.emit("join-document", documentId);

    const handleDocumentUpdate = (newContent) => {
      setDocContent(newContent);
      onContentChange(newContent);
    };
    const handleCodeUpdate = (newCode) => {
      setCodeContent(newCode ?? "");
    };
    const handleLoad = (data) => {
      setDocContent(data?.content || "");
      setCodeContent(typeof data?.code === 'string' ? data.code : "");
      setDocumentTitle((prev) => prev || data?.title || "Untitled Document");
      onContentChange(data?.content || "");
    };

    socket.on("document-updated", handleDocumentUpdate);
    socket.on("code-updated", handleCodeUpdate);
    socket.on("load-document", handleLoad);

    axios
      .get(`${API_BASE_URL}/api/collaboration/${documentId}`, { withCredentials: false })
      .then((res) => {
        setDocContent(res.data.content || "");
        setDocumentTitle((prev) => prev || res.data.title || "Untitled Document");
        onContentChange(res.data.content || "");
        // Load code content from backend (fallback to existing state)
        if (typeof res.data.code === 'string') {
          setCodeContent(res.data.code);
        }
      })
      .catch((err) => console.error("Error fetching document:", err));

    return () => {
      socket.off("document-updated", handleDocumentUpdate);
      socket.off("code-updated", handleCodeUpdate);
      socket.off("load-document", handleLoad);
      socket.emit("leave-document", documentId);
    };
  }, [documentId,onContentChange]);

  const emitDocChange = useCallback(
    debounce((value) => {
      console.log("Sending updated content to backend:", value);
      socket.emit("edit-document", { documentId, content: value });
      setIsSaving(false);
    }, 1000),
    [documentId]
  );

  // Document editor change handler (synced)
  const handleDocChange = (value) => {
    setDocContent(value);
    setIsSaving(true);
    // Only emit change if user can edit
    if (userRole === "editor" || userRole === "admin") {
      emitDocChange(value);
    }
    onContentChange(value);
  };

  // Code editor change handler (persist to backend + local + realtime)
  const handleCodeChange = useCallback(
    debounce((value) => {
      const next = value ?? "";
      setCodeContent(next);
      // Save to backend if user can edit
      if (userRole === "editor" || userRole === "admin") {
        // realtime broadcast
        socket.emit("edit-code", { documentId, code: next });
        // persistence endpoint (optional backup)
        fetch(`${API_BASE_URL}/api/collaboration/${documentId}/code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: next }),
        }).catch((err) => console.error('Failed to save code:', err));
      }
    }, 300),
    [API_BASE_URL, documentId, userRole]
  );

  useEffect(() => {
    console.log("Received externalContent in Editor:", externalContent);
    if (externalContent !== undefined && externalContent !== docContent) {
      setDocContent(externalContent);
      console.log("Updated doc editor content:", externalContent);
      // onContentChange(externalContent);
    }
  }, [externalContent, docContent])


  const readOnly = userRole === "viewer";

  // Track and restore text selection inside the custom contentEditable
  const selectionRangeRef = useRef(null);

  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const el = document.getElementById("custom-editor");
      if (!el) return;
      const anchor = sel.anchorNode;
      if (anchor && el.contains(anchor)) {
        // Persist a clone so later edits don't mutate it
        selectionRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  const focusAndRestoreSelection = () => {
    const el = document.getElementById("custom-editor");
    if (el) el.focus();
    const sel = window.getSelection();
    if (sel && selectionRangeRef.current) {
      try {
        sel.removeAllRanges();
        sel.addRange(selectionRangeRef.current);
      } catch {}
    }
  };

  const applyCommand = (command, value) => {
    if (readOnly) return;
    focusAndRestoreSelection();
    document.execCommand(command, false, value || undefined);
  };

  const applyHeading = (level) => {
    if (readOnly) return;
    focusAndRestoreSelection();
    // Use formatBlock for headings
    document.execCommand("formatBlock", false, `H${level}`);
  };

  const applyList = (ordered) => {
    if (readOnly) return;
    focusAndRestoreSelection();
    document.execCommand(ordered ? "insertOrderedList" : "insertUnorderedList");
  };

  const applyAlign = (align) => {
    if (readOnly) return;
    focusAndRestoreSelection();
    document.execCommand("justify" + align);
  };

  const insertLink = () => {
    if (readOnly) return;
    const url = window.prompt("Enter URL");
    if (url) {
      focusAndRestoreSelection();
      document.execCommand("createLink", false, url);
    }
  };

  const removeLink = () => {
    if (readOnly) return;
    applyCommand("unlink");
  };

  const insertCodeBlock = () => {
    if (readOnly) return;
    applyCommand("formatBlock", "PRE");
  };

  const insertBlockquote = () => {
    if (readOnly) return;
    applyCommand("formatBlock", "BLOCKQUOTE");
  };

  const setTextColor = () => {
    if (readOnly) return;
    const color = window.prompt("Enter text color (e.g. #ff0000 or red)");
    if (color) applyCommand("foreColor", color);
  };

  const setHighlight = () => {
    if (readOnly) return;
    const color = window.prompt("Enter highlight color (e.g. #ffff00)");
    // Note: hiliteColor support varies by browser; this works in most Chromium builds for contentEditable
    if (color) applyCommand("hiliteColor", color);
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h5" fontWeight={700}>{documentTitle || "Untitled Document"}</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {userRole && <Chip size="small" label={`Role: ${userRole}`} color={userRole === 'admin' ? 'secondary' : userRole === 'editor' ? 'primary' : 'default'} />}
          <Typography variant="caption" color="text.secondary">{isSaving ? "Saving..." : "Saved"}</Typography>
        </Stack>
      </Stack>
      {!readOnly && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => setIsCodeMode(false)} variant={!isCodeMode ? 'contained' : 'outlined'}>Normal Editor</Button>
            <Button onClick={() => setIsCodeMode(true)} variant={isCodeMode ? 'contained' : 'outlined'}>Code Editor</Button>
          </ButtonGroup>

          {!isCodeMode && (
            <>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Undo"><IconButton size="small" onClick={() => applyCommand('undo')}><UndoIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Redo"><IconButton size="small" onClick={() => applyCommand('redo')}><RedoIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Clear formatting"><IconButton size="small" onClick={() => applyCommand('removeFormat')}><FormatClearIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Heading 1"><Button onClick={() => applyHeading(1)}><TitleIcon fontSize="small" /></Button></Tooltip>
                <Tooltip title="Heading 2"><Button onClick={() => applyHeading(2)}><TitleIcon fontSize="small" /></Button></Tooltip>
                <Tooltip title="Heading 3"><Button onClick={() => applyHeading(3)}><TitleIcon fontSize="small" /></Button></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Bold"><IconButton size="small" onClick={() => applyCommand('bold')}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Italic"><IconButton size="small" onClick={() => applyCommand('italic')}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Underline"><IconButton size="small" onClick={() => applyCommand('underline')}><FormatUnderlinedIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Strikethrough"><IconButton size="small" onClick={() => applyCommand('strikeThrough')}><FormatStrikethroughIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Superscript"><IconButton size="small" onClick={() => applyCommand('superscript')}><SuperscriptIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Subscript"><IconButton size="small" onClick={() => applyCommand('subscript')}><SubscriptIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Bulleted list"><IconButton size="small" onClick={() => applyList(false)}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Numbered list"><IconButton size="small" onClick={() => applyList(true)}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Align left"><IconButton size="small" onClick={() => applyAlign('Left')}><FormatAlignLeftIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Align center"><IconButton size="small" onClick={() => applyAlign('Center')}><FormatAlignCenterIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Align right"><IconButton size="small" onClick={() => applyAlign('Right')}><FormatAlignRightIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Insert link"><IconButton size="small" onClick={insertLink}><LinkIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Remove link"><IconButton size="small" onClick={removeLink}><LinkOffIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Code block"><IconButton size="small" onClick={insertCodeBlock}><CodeIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Blockquote"><IconButton size="small" onClick={insertBlockquote}><FormatQuoteIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
              <ButtonGroup size="small" variant="outlined" onMouseDown={(e) => e.preventDefault()}>
                <Tooltip title="Text color"><IconButton size="small" onClick={setTextColor}><FormatColorTextIcon fontSize="small" /></IconButton></Tooltip>
                <Tooltip title="Highlight"><IconButton size="small" onClick={setHighlight}><FormatColorFillIcon fontSize="small" /></IconButton></Tooltip>
              </ButtonGroup>
            </>
          )}
        </Stack>
      )}

      {isCodeMode ? (
        <CodeEditor
          value={codeContent}
          onChange={handleCodeChange}
          readOnly={readOnly}
          editorId={`code-editor:${documentId}`}
        />
      ) : (
        <CustomEditor value={docContent} onChange={handleDocChange} readOnly={readOnly} editorId="custom-editor" />
      )}

      {readOnly && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          You have view-only access to this document.
        </Typography>
      )}
    </Paper>
  );
};

export default Editor;