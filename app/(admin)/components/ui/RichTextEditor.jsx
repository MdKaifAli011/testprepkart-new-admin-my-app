"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

const CKEDITOR_SCRIPT = "/vendor/ckeditor/ckeditor.js";
const MATHJAX_SCRIPT = "/vendor/mathjax/MathJax.js?config=TeX-AMS_HTML";

const RichTextEditor = ({
  value = "",
  onChange,
  placeholder = "Start writing your content...",
  disabled = false,
  className = "",
}) => {
  const textareaRef = useRef(null);
  const editorRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const placeholderRef = useRef(placeholder);

  const instanceId = useMemo(
    () => `rte-${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalWarn = console.warn;
    const originalError = console.error;
    const marker = "CKEditor 4.22.1";

    const shouldSuppress = (args) =>
      args.some((arg) => typeof arg === "string" && arg.includes(marker));

    console.warn = (...args) => {
      if (shouldSuppress(args)) return;
      originalWarn(...args);
    };

    console.error = (...args) => {
      if (shouldSuppress(args)) return;
      originalError(...args);
    };

    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const toolbarConfig = useMemo(
    () => [
      {
        name: "document",
        items: ["Source", "NewPage", "Preview", "Print", "Templates"],
      },
      { name: "clipboard", items: ["Cut", "Copy", "Paste", "Undo", "Redo"] },
      { name: "editing", items: ["Find", "Replace", "SelectAll", "Scayt"] },
      { name: "styles", items: ["Format", "Font", "FontSize"] },
      {
        name: "basicstyles",
        items: [
          "Bold",
          "Italic",
          "Underline",
          "Strike",
          "Subscript",
          "Superscript",
          "RemoveFormat",
        ],
      },
      { name: "colors", items: ["TextColor", "BGColor"] },
      {
        name: "paragraph",
        items: [
          "NumberedList",
          "BulletedList",
          "Outdent",
          "Indent",
          "Blockquote",
          "JustifyLeft",
          "JustifyCenter",
          "JustifyRight",
          "JustifyBlock",
        ],
      },
      {
        name: "insert",
        items: [
          "Image",
          "Table",
          "HorizontalRule",
          "Smiley",
          "SpecialChar",
          "Iframe",
          "Mathjax",
        ],
      },
      { name: "links", items: ["Link", "Unlink", "Anchor"] },
      { name: "tools", items: ["Maximize", "ShowBlocks"] },
      { name: "about", items: ["About"] },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    const ensureScript = (src, attr) =>
      new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[${attr}]`);
        if (existing) {
          if (
            existing.dataset.loaded === "true" ||
            existing.readyState === "complete"
          ) {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.setAttribute(attr, "true");
        script.addEventListener("load", () => {
          script.dataset.loaded = "true";
          resolve();
        });
        script.addEventListener("error", reject);
        document.head.appendChild(script);
      });

    const initializeEditor = async () => {
      if (typeof window === "undefined") return;

      await ensureScript(CKEDITOR_SCRIPT, "data-ckeditor");
      await ensureScript(MATHJAX_SCRIPT, "data-mathjax");

      if (!isMounted || !textareaRef.current) return;

      const { CKEDITOR } = window;
      if (!CKEDITOR) return;

      try {
        if (CKEDITOR.config) {
          CKEDITOR.config.versionCheck = false;
        }
      } catch (error) {
        // silently ignore inability to override version check
      }

      if (!CKEDITOR._suppressLegacyWarning) {
        CKEDITOR._suppressLegacyWarning = true;
        CKEDITOR.on("notificationShow", (evt) => {
          try {
            const message = evt?.data?.notification?.message;
            if (
              typeof message === "string" &&
              message.includes("CKEditor 4.22.1")
            ) {
              evt.data.notification?.hide?.();
              evt.cancel();
            }
          } catch (error) {
            // ignore suppression errors
          }
        });
      }

      if (CKEDITOR.instances[instanceId]) {
        CKEDITOR.instances[instanceId].destroy(true);
      }

      const editor = CKEDITOR.replace(textareaRef.current, {
        height: 420,
        removePlugins: "resize",
        extraPlugins:
          "mathjax,colorbutton,colordialog,justify,font,clipboard,smiley",
        mathJaxLib: MATHJAX_SCRIPT,
        autoParagraph: true,
        ignoreEmptyParagraph: true,
        allowedContent: true,
        placeholder: placeholderRef.current,
        readOnly: false,
        toolbar: toolbarConfig,
      });

      editorRef.current = editor;

      editor.on("instanceReady", () => {
        if (!isMounted) return;
        setIsReady(true);
        if (valueRef.current) {
          editor.setData(valueRef.current);
        }
        if (disabled) {
          editor.setReadOnly(true);
        }
        editor.fire("change");
      });

      editor.on("change", () => {
        const data = editor.getData();
        onChangeRef.current?.(data);
      });
    };

    initializeEditor().catch((error) => {
      console.error("Failed to initialize CKEditor", error);
    });

    return () => {
      isMounted = false;
      if (editorRef.current) {
        editorRef.current.destroy(true);
        editorRef.current = null;
      }
    };
  }, [toolbarConfig, instanceId, disabled]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const currentData = editor.getData();
    if (value !== undefined && value !== currentData) {
      editor.setData(value || "");
    }
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.setReadOnly(disabled);
  }, [disabled]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.config.placeholder = placeholder;
  }, [placeholder]);

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-sm ${
        disabled ? "opacity-90" : ""
      } ${className}`}
    >
      {!isReady && (
        <div className="flex min-h-[240px] items-center justify-center text-sm text-gray-500">
          Loading editor...
        </div>
      )}
      <textarea
        id={instanceId}
        ref={textareaRef}
        defaultValue={value}
        style={{ display: isReady ? "none" : "block" }}
        aria-label="Rich text editor"
      />
    </div>
  );
};

export default RichTextEditor;
