"""extend/index.html → extend/index.md: the same documentation as plain Markdown, for agents and llms.txt.

    python3 tools/html2md.py            # rewrites extend/index.md

Reads the hero and the documentation article; drops navigation, the footer and scripts.
"""
import html, os, re, sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://echo.onetest.ai"
BLOCK = {"p", "div", "section", "figure", "dl", "ul", "ol", "li", "dt", "dd", "h1", "h2", "h3", "pre", "figcaption", "nav"}


class Md(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack, self.skip, self.pre, self.href, self.cls = [], [], 0, False, None, []
        self.step, self.in_step = 0, False

    def nl(self, n=2):
        text = "".join(self.out).rstrip(" ")
        self.out = [text + "\n" * max(0, n - (len(text) - len(text.rstrip("\n"))))] if text else []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "") or ""
        if self.skip or tag in ("script", "style", "header", "footer") or "dtoc" in cls or "surf-nav" in cls or tag == "nav" and "Documentation" in a.get("aria-label", ""):
            if tag not in ("br", "img"):
                self.skip += 1
            return
        if "qs-n" in cls:  # a quick-start step's number: said in its heading instead
            self.skip += 1
            return
        self.stack.append(tag)
        self.cls.append(cls)
        inside = " ".join(self.cls)
        if tag == "small" and " f " in f" {inside} ".replace("fields", ""):
            self.out.append(" ("); self.stack[-1] = "small-f"
            return
        if tag == "span" and "capline" in inside:
            self.out.append(" — ")
            return
        if tag == "li" and "qs-step" in cls:
            self.step += 1; self.in_step = True; self.nl(); self.stack[-1] = "div"
            return
        if tag in ("h1", "h2", "h3"):
            self.nl(); self.out.append("#" * int(tag[1]) + " ")
            if tag == "h3" and self.in_step:
                self.out.append(f"{self.step}. "); self.in_step = False
        elif tag == "pre":
            self.nl(); self.out.append("```\n"); self.pre = True
        elif tag == "code" and not self.pre:
            self.out.append("`")
        elif tag in ("b", "strong"):
            self.out.append("**")
        elif tag == "a":
            if "".join(self.out).endswith(")"):
                self.out.append(" · ")
            self.href = a.get("href", ""); self.out.append("[")
        elif tag == "figcaption":
            self.nl(); self.out.append("File ")
        elif tag == "li":
            self.nl(1); self.out.append("- ")
        elif tag == "dt":
            self.nl(1); self.out.append("- ")
        elif tag == "dd":
            self.out.append(" — ")
        elif tag == "img":
            src = a.get("src", "")
            self.nl(); self.out.append(f"![{a.get('alt', '')}]({SITE}{src})"); self.nl()
        elif "needs" in cls:
            self.out.append(" — ")
        elif "fn-h" in cls:
            self.nl(); self.out.append("#### ")
        elif "cap-h" in cls or "capline" in cls or "where-in" in cls:
            self.nl()
        elif tag in BLOCK:
            self.nl()

    def handle_endtag(self, tag):
        if self.skip:
            if tag not in ("br", "img"):
                self.skip -= 1
            return
        if not self.stack:
            return
        opened = self.stack.pop()
        if self.cls:
            self.cls.pop()
        if opened == "small-f":
            self.out.append("): ")
            return
        if tag == "pre":
            self.out.append("\n```"); self.pre = False; self.nl()
        elif tag == "code" and not self.pre:
            self.out.append("`")
        elif tag in ("b", "strong"):
            self.out.append("**")
        elif tag == "small":
            self.out.append(": ")
        elif tag == "figcaption":
            self.out.append(":"); self.nl(1)
        elif tag == "a":
            h = self.href or ""
            if h.startswith("/"):
                h = SITE + h
            elif h.startswith("#"):
                h = h
            self.out.append(f"]({h})"); self.href = None
        elif tag in BLOCK and tag not in ("dt", "figcaption"):
            self.nl(2 if tag not in ("li", "dd") else 1)

    def handle_data(self, data):
        if self.skip:
            return
        if self.pre:
            self.out.append(data)
        else:
            self.out.append(re.sub(r"\s+", " ", data))


src = open(os.path.join(ROOT, "extend", "index.html"), encoding="utf-8").read()
body = src[src.index('<section class="hero x-hero"'):src.index("</main>")]
p = Md(); p.feed(body)
md = "".join(p.out)
md = re.sub(r"\n{3,}", "\n\n", md).strip() + "\n"
md = re.sub(r"`` ", "`", md)
head = (f"<!-- Generated from extend/index.html by tools/html2md.py. Types: {SITE}/extend/echo-plugin.d.ts -->\n\n")
open(os.path.join(ROOT, "extend", "index.md"), "w", encoding="utf-8").write(head + md)
print(len(md))
