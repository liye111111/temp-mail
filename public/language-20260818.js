const locale = document.documentElement.lang === "ja" ? "ja" : document.documentElement.lang.startsWith("zh") ? "zh" : "en";
const select = document.querySelector(".language-select");
if (select) {
  select.value = locale;
  select.addEventListener("change", () => {
    const target = new URL(location.href);
    target.searchParams.set("language", select.value);
    location.assign(target.toString());
  });
}
