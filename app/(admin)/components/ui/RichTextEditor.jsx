"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaLink,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaHeading,
  FaImage,
  FaCode,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaAlignJustify,
  FaUndo,
  FaRedo,
  FaTable,
  FaStrikethrough,
  FaParagraph,
  FaFont,
  FaEraser,
} from "react-icons/fa";

/**
 * Improved RichTextEditor
 * - Better active-format detection (headings, lists, table, image, button, code, blockquote, link, alignment)
 * - MutationObserver to keep toolbar in sync when DOM changes (insert image/table/button)
 * - Small debounce on updates to avoid spamming updates on rapid input events
 *
 * Note: document.execCommand is deprecated but still supported broadly — works for this editor.
 */

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start writing your content...",
  disabled = false,
  className = "",
}) => {
  const editorRef = useRef(null);
  const observerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [activeFormats, setActiveFormats] = useState({});
  const updateTimeoutRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // utility: find parent element of a node matching selector
  const closest = (node, selector) => {
    if (!node) return null;
    if (node.nodeType === 3) node = node.parentElement;
    while (node) {
      try {
        if (node.matches && node.matches(selector)) return node;
      } catch (e) {
        // invalid selector
      }
      node = node.parentElement;
    }
    return null;
  };

  // Debounced update to avoid too frequent state updates
  const queueUpdateActiveFormats = useCallback(() => {
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(() => {
      updateActiveFormats();
    }, 80);
  }, []);

  // Update active formats when selection changes or content changes
  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const formats = {
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      heading: null,
      list: null,
      table: false,
      image: false,
      button: false,
      link: false,
      codeblock: false,
      blockquote: false,
      align: null,
    };

    try {
      formats.bold = document.queryCommandState("bold");
      formats.italic = document.queryCommandState("italic");
      formats.underline = document.queryCommandState("underline");
      formats.strikethrough = document.queryCommandState("strikeThrough");
    } catch (e) {
      // ignore errors from queryCommandState in some browsers
    }

    // Determine the node we should inspect: either selection anchor or caret container
    let nodeToInspect = null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      nodeToInspect =
        range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer;
    } else {
      // fallback: use caret position or editor first child
      nodeToInspect = editorRef.current;
    }

    if (!nodeToInspect) nodeToInspect = editorRef.current;

    // If caret is inside an empty text node or inside editor, try to find nearest block ancestor
    let blockElement = nodeToInspect;
    while (
      blockElement &&
      blockElement !== editorRef.current &&
      !/^(P|DIV|H[1-6]|BLOCKQUOTE|PRE|LI|TD|TH)$/.test(blockElement.tagName)
    ) {
      blockElement = blockElement.parentElement;
    }
    if (!blockElement || blockElement === editorRef.current) {
      // fallback to direct child or last element
      blockElement = nodeToInspect;
    }

    // heading detection
    const tagName = blockElement?.tagName?.toLowerCase();
    if (tagName?.match(/^h[1-6]$/)) {
      formats.heading = tagName; // 'h1', 'h2', etc.
    } else if (tagName === "p" || tagName === "div") {
      formats.heading = "p";
    } else if (tagName === "blockquote") {
      formats.heading = "blockquote";
      formats.blockquote = true;
    } else if (tagName === "pre") {
      formats.heading = "pre";
      formats.codeblock = true;
    }

    // alignment detection via computed style of block element
    try {
      const computedStyle = window.getComputedStyle(
        blockElement || editorRef.current
      );
      formats.align = computedStyle.textAlign || "left";
    } catch (e) {
      formats.align = null;
    }

    // list detection: closest ul or ol
    const ul = closest(nodeToInspect, "ul");
    const ol = closest(nodeToInspect, "ol");
    if (ul) formats.list = "ul";
    else if (ol) formats.list = "ol";

    // table detection
    const table = closest(nodeToInspect, "table");
    if (table) formats.table = true;

    // image detection: either cursor on an <img> or an ancestor contains an <img>
    const imgNode =
      nodeToInspect.nodeType === 1 && nodeToInspect.tagName === "IMG"
        ? nodeToInspect
        : closest(nodeToInspect, "img");
    if (imgNode) formats.image = true;

    // button detection: <button> or <a> that looks like a button (common class name patterns)
    const buttonNode =
      closest(nodeToInspect, "button") ||
      closest(
        nodeToInspect,
        'a[href].button, a[href][class*="btn"], a[href][class*="button"], a[href][class*="bg-"]'
      );
    if (buttonNode) formats.button = true;

    // link detection
    const linkNode = closest(nodeToInspect, "a[href]");
    if (linkNode) formats.link = true;

    // blockquote detection (also set above)
    if (closest(nodeToInspect, "blockquote")) {
      formats.blockquote = true;
      formats.heading = "blockquote";
    }

    // code block detection (pre/code)
    if (closest(nodeToInspect, "pre") || closest(nodeToInspect, "code")) {
      formats.codeblock = true;
      formats.heading = "pre";
    }

    setActiveFormats(formats);
  }, []);

  // selection change handler
  const handleSelectionChange = useCallback(() => {
    if (isFocused) queueUpdateActiveFormats();
  }, [isFocused, queueUpdateActiveFormats]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [handleSelectionChange]);

  // Observe DOM mutations inside editor (images, tables, buttons inserted/pasted)
  useEffect(() => {
    if (!editorRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observerRef.current = new MutationObserver(() => {
      queueUpdateActiveFormats();
    });
    observerRef.current.observe(editorRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [queueUpdateActiveFormats]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
    queueUpdateActiveFormats();
  };

  const handleFocus = () => {
    setIsFocused(true);
    queueUpdateActiveFormats();
  };

  const handleBlur = () => {
    setIsFocused(false);
    // small delay to ensure selection/format update after blur (so toolbar isn't stale)
    setTimeout(() => {
      queueUpdateActiveFormats();
    }, 50);
  };

  // wrapper for execCommand with safe parameters
  const execCommand = (command, value = null) => {
    if (!editorRef.current || disabled) return;
    editorRef.current.focus();
    try {
      // Some browsers expect the value as third argument
      document.execCommand(command, false, value);
    } catch (e) {
      // ignore
    }
    handleInput();
    setTimeout(queueUpdateActiveFormats, 10);
  };

  const isCommandActive = (command) => {
    try {
      return document.queryCommandState(command);
    } catch (e) {
      return false;
    }
  };

  // Insert link
  const insertLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    const url = prompt("Enter URL:", selectedText || "https://");
    if (url) {
      if (selectedText) {
        execCommand("createLink", url);
      } else {
        const linkHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
        execCommand("insertHTML", linkHTML);
      }
    }
  };

  // Insert heading reliably using explicit <h#> tag in formatBlock
  const insertHeading = (level) => {
    if (!editorRef.current || disabled) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString()) {
      // wrap selection in heading element
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const heading = document.createElement(`h${level}`);
      heading.textContent = selectedText;
      range.deleteContents();
      range.insertNode(heading);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(heading);
      selection.addRange(newRange);
    } else {
      // use formatBlock with explicit tag
      execCommand("formatBlock", `<h${level}>`);
    }
    handleInput();
    setTimeout(queueUpdateActiveFormats, 10);
  };

  const removeFormat = () => {
    if (!editorRef.current || disabled) return;
    editorRef.current.focus();
    execCommand("removeFormat");
    execCommand("formatBlock", "<p>");
  };

  const setNormalText = () => {
    if (!editorRef.current || disabled) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && selection.toString()) {
      const range = selection.getRangeAt(0);
      const selectedText = range.toString();
      const textNode = document.createTextNode(selectedText);
      range.deleteContents();
      range.insertNode(textNode);
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(textNode);
      selection.addRange(newRange);
    } else {
      execCommand("removeFormat");
      execCommand("formatBlock", "<p>");
    }
    handleInput();
    setTimeout(queueUpdateActiveFormats, 10);
  };

  const setParagraph = () => {
    if (!editorRef.current || disabled) return;
    editorRef.current.focus();
    execCommand("formatBlock", "<p>");
    handleInput();
    setTimeout(queueUpdateActiveFormats, 10);
  };

  const insertImage = () => {
    const url = prompt("Enter image URL:");
    if (url) {
      const alt = prompt("Enter alt text (optional):") || "";
      const img = `<img src="${url}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; display:block;" />`;
      execCommand("insertHTML", img);
    }
  };

  const insertButton = () => {
    const text = prompt("Enter button text:");
    const url = prompt("Enter button URL (optional):");
    if (text) {
      const button = url
        ? `<a href="${url}" class="inline-block px-4 py-2 rounded-lg font-medium no-underline button-like" target="_blank" rel="noopener noreferrer">${text}</a>`
        : `<button class="px-4 py-2 rounded-lg font-medium button-like">${text}</button>`;
      execCommand("insertHTML", button);
    }
  };

  const insertCode = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || "";
    if (selectedText) {
      const codeBlock = document.createElement("pre");
      codeBlock.style.cssText =
        "background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 8px; overflow-x: auto; font-family: monospace;";
      const codeEl = document.createElement("code");
      codeEl.textContent = selectedText;
      codeBlock.appendChild(codeEl);
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(codeBlock);
      handleInput();
    } else {
      execCommand("formatBlock", "<pre>");
    }
  };

  const setAlignment = (align) => {
    // map align values to execCommand justify* commands
    if (align === "left") execCommand("justifyLeft");
    else if (align === "center") execCommand("justifyCenter");
    else if (align === "right") execCommand("justifyRight");
    else if (align === "justify") execCommand("justifyFull");
    setTimeout(queueUpdateActiveFormats, 10);
  };

  const insertTable = () => {
    const rows = prompt("Enter number of rows (2-10):", "3");
    const cols = prompt("Enter number of columns (2-10):", "3");

    if (rows && cols && !isNaN(rows) && !isNaN(cols)) {
      const numRows = Math.min(Math.max(parseInt(rows), 2), 10);
      const numCols = Math.min(Math.max(parseInt(cols), 2), 10);

      let tableHTML =
        '<table class="border-collapse border border-gray-300 w-full" role="table">';

      // header
      tableHTML += "<thead><tr>";
      for (let j = 0; j < numCols; j++) {
        tableHTML += `<th class="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">Header ${
          j + 1
        }</th>`;
      }
      tableHTML += "</tr></thead>";

      // body
      tableHTML += "<tbody>";
      for (let i = 0; i < numRows - 1; i++) {
        tableHTML += "<tr>";
        for (let j = 0; j < numCols; j++) {
          tableHTML += `<td class="border border-gray-300 px-4 py-2">Cell ${
            i + 1
          },${j + 1}</td>`;
        }
        tableHTML += "</tr>";
      }
      tableHTML += "</tbody></table>";

      execCommand("insertHTML", tableHTML);
    }
  };

  // Render -------------------------------------------------------------------
  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden relative bg-white shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}
    >
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-3 shadow-sm">
        {/* Text Formatting - Bold, Italic, Underline, Strikethrough */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.bold || isCommandActive("bold")
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
            }`}
            disabled={disabled}
            title="Bold (Ctrl+B)"
          >
            <FaBold className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("italic")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.italic || isCommandActive("italic")
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
            }`}
            disabled={disabled}
            title="Italic (Ctrl+I)"
          >
            <FaItalic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("underline")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.underline || isCommandActive("underline")
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
            }`}
            disabled={disabled}
            title="Underline (Ctrl+U)"
          >
            <FaUnderline className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("strikeThrough")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.strikethrough || isCommandActive("strikeThrough")
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
            }`}
            disabled={disabled}
            title="Strikethrough"
          >
            <FaStrikethrough className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

        {/* Headings & Text Format */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => insertHeading(1)}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-200 font-semibold text-xs ${
              activeFormats.heading === "h1"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-indigo-50"
            }`}
            disabled={disabled}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => insertHeading(2)}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-200 font-semibold text-xs ${
              activeFormats.heading === "h2"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-indigo-50"
            }`}
            disabled={disabled}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => insertHeading(3)}
            className={`px-2.5 py-1.5 rounded-md transition-colors duration-200 font-semibold text-xs ${
              activeFormats.heading === "h3"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-indigo-50"
            }`}
            disabled={disabled}
            title="Heading 3"
          >
            H3
          </button>
          <div className="hidden md:block w-px h-4 bg-gray-300 mx-1"></div>
          <button
            type="button"
            onClick={setParagraph}
            className={`hidden md:flex px-2.5 py-1.5 rounded-md transition-colors duration-200 ${
              activeFormats.heading === "p" || !activeFormats.heading
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
            }`}
            disabled={disabled}
            title="Paragraph"
          >
            <FaParagraph className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={setNormalText}
            className="hidden md:flex px-2.5 py-1.5 rounded-md transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            disabled={disabled}
            title="Normal Text"
          >
            <FaFont className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={removeFormat}
            className="px-2.5 py-1.5 rounded-md transition-colors duration-200 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={disabled}
            title="Clear Formatting"
          >
            <FaEraser className="w-3 h-3" />
          </button>
        </div>

        <div className="hidden md:block w-px h-6 bg-gray-300"></div>

        {/* Lists */}
        <div className="hidden md:flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => execCommand("insertUnorderedList")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.list === "ul"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-purple-50"
            }`}
            disabled={disabled}
            title="Bullet List"
          >
            <FaListUl className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("insertOrderedList")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.list === "ol"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-purple-50"
            }`}
            disabled={disabled}
            title="Numbered List"
          >
            <FaListOl className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden lg:block w-px h-6 bg-gray-300"></div>

        {/* Alignment */}
        <div className="hidden lg:flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => setAlignment("left")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.align === "left"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-green-50"
            }`}
            disabled={disabled}
            title="Align Left"
          >
            <FaAlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setAlignment("center")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.align === "center"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-green-50"
            }`}
            disabled={disabled}
            title="Align Center"
          >
            <FaAlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setAlignment("right")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.align === "right"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-green-50"
            }`}
            disabled={disabled}
            title="Align Right"
          >
            <FaAlignRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setAlignment("justify")}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.align === "justify"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-green-50"
            }`}
            disabled={disabled}
            title="Justify"
          >
            <FaAlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

        {/* Media & Elements */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={insertImage}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.image
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-pink-50"
            }`}
            disabled={disabled}
            title="Insert Image"
          >
            <FaImage className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={insertLink}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.link
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-pink-50"
            }`}
            disabled={disabled}
            title="Insert Link"
          >
            <FaLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={insertButton}
            className={`hidden md:flex p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.button
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-pink-50"
            }`}
            disabled={disabled}
            title="Insert Button"
          >
            🔘
          </button>

          <button
            type="button"
            onClick={() => execCommand("formatBlock", "<blockquote>")}
            className={`hidden lg:flex p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.blockquote
                ? "bg-yellow-500 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-yellow-50"
            }`}
            disabled={disabled}
            title="Quote"
          >
            <FaQuoteLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={insertCode}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.codeblock
                ? "bg-gray-700 text-white"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
            disabled={disabled}
            title="Code Block"
          >
            <FaCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={insertTable}
            className={`hidden sm:flex p-2 rounded-lg transition-colors duration-200 ${
              activeFormats.table
                ? "bg-pink-100 text-pink-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-pink-50"
            }`}
            disabled={disabled}
            title="Insert Table"
          >
            <FaTable className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

        {/* History */}
        <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          <button
            type="button"
            onClick={() => execCommand("undo")}
            className="p-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-orange-50"
            disabled={disabled}
            title="Undo (Ctrl+Z)"
          >
            <FaUndo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            type="button"
            onClick={() => execCommand("redo")}
            className="p-2 rounded-lg transition-colors duration-200 text-gray-600 hover:text-gray-900 hover:bg-orange-50"
            disabled={disabled}
            title="Redo (Ctrl+Y)"
          >
            <FaRedo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`rich-text-content min-h-[250px] sm:min-h-[300px] md:min-h-[350px] p-4 sm:p-6 md:p-8 text-sm sm:text-base text-gray-700 focus:outline-none prose prose-sm sm:prose-base md:prose-lg max-w-none transition-all duration-300 ${
          isFocused
            ? "ring-2 ring-blue-500 ring-opacity-20 bg-blue-50/30"
            : "bg-white"
        } ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
        style={{
          minHeight: "250px",
          lineHeight: "1.75",
          direction: "ltr",
          textAlign: "left",
          whiteSpace: "pre-wrap",
        }}
        suppressContentEditableWarning={true}
      />

      {!value && !isFocused && (
        <div className="absolute top-20 sm:top-24 md:top-28 left-4 sm:left-6 md:left-8 text-gray-400 pointer-events-none text-sm sm:text-base italic">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
