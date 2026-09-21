// Sets the colour theme before the page is painted to avoid a flash (BRD U-3).
// Loaded as an external file so the Content-Security-Policy can forbid inline scripts.
(function () {
  var theme;
  try {
    theme = localStorage.getItem("numflo:theme");
  } catch {
    theme = null;
  }
  if (theme !== "light" && theme !== "dark") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
