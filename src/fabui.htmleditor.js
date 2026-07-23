import fabui from './fabui.js?v=20260723-html-editor-v1';
import { createHtmlEditorFactory } from './htmleditor/htmleditor.js?v=20260723-html-editor-v8';

if (!fabui.HtmlEditor) {
  fabui.HtmlEditor = createHtmlEditorFactory(fabui);
}

var HtmlEditor = fabui.HtmlEditor;

export { fabui, HtmlEditor };
export default fabui;
