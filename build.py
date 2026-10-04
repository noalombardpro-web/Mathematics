"""Assemble src/ en un seul fichier index.html."""
import pathlib
s = pathlib.Path(__file__).parent / "src"
r = lambda f: (s / f).read_text(encoding="utf-8")
out = (r("shell.html").replace("/*STYLE*/", r("style.css"))
       .replace("<!--CH1-->", r("ch1.html")).replace("<!--CH2-->", r("ch2.html"))
       .replace("/*SCRIPT*/", r("app.js")))
(pathlib.Path(__file__).parent / "index.html").write_text(out, encoding="utf-8")
print(len(out), "octets")
