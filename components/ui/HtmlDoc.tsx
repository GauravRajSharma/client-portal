/**
 * Full-page, zoomable HTML document viewer (prescriptions, procedure/radiology reports,
 * any hospital HTML). Fills its container — never squeezed — and fits a fixed paper
 * width to the screen so A4/A5 layouts read at full size while staying pinch/scroll
 * zoomable. Native uses WebView (pinch + zoom controls); web uses a full iframe.
 */
import { Platform } from "react-native";

// Hospital HTML is laid out for a fixed paper width (~A4). Treat the doc as that width
// and fit-to-screen so it isn't cramped.
const PAGE_WIDTH = 820;

export function docHtml(html: string): string {
  const cleaned = html.replace(/<meta[^>]*name=["']?viewport["']?[^>]*>/gi, "");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${PAGE_WIDTH}, user-scalable=yes"><style>html,body{margin:0;padding:8px;background:#fff;-webkit-text-size-adjust:100%}img,table{max-width:100%}</style></head><body>${cleaned}</body></html>`;
}

export function HtmlDoc({ html }: { html: string }) {
  const withZoom = docHtml(html);
  if (Platform.OS !== "web") {
    const { WebView } = require("react-native-webview");
    return (
      <WebView
        originWhitelist={["*"]}
        source={{ html: withZoom }}
        style={{ flex: 1, backgroundColor: "#fff" }}
        scalesPageToFit
        setBuiltInZoomControls
        setDisplayZoomControls={false}
        scrollEnabled
      />
    );
  }
  return (
    <iframe
      srcDoc={withZoom}
      style={{ border: "none", width: "100%", height: "100%", background: "#fff", display: "block" }}
      title="Document"
    />
  );
}
