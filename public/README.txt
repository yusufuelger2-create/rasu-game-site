RASU GAMES - FOOTBALLER NAME GENERATOR

Files
-----
index.html   Main website page
styles.css   Main website styles + generator styles
app.js       Website interactions + generator logic
names.json   Country name database used by the generator

Important
---------
The generator loads names.json with fetch(), so do not open index.html directly with file://.
Run the folder through a local web server.

Python:
  cd rasu-games-site
  python -m http.server 8000
Then open:
  http://localhost:8000/

Node (if installed):
  npx serve .

Generator features
------------------
- Germany, England, France, Spain, Brazil and Turkey
- 1-20 generated players
- 0-100% new-name ratio in 5% steps
- Country-specific real first/last names
- Country-specific synthetic first-name patterns
- No duplicate full names in one generation
- Optional session-wide duplicate protection
- Copy All button
- sessionStorage keeps the no-repeat list after refresh in the same browser session
- Closing the browser tab/session clears sessionStorage

To add another country
----------------------
Add a new object under names.json -> countries with:
label, flag, firstNames, lastNames, syllables, endings, patterns
Then add one <option> to #nameCountry in index.html.

Note
----
Synthetic names are designed to sound country-appropriate rather than being random character strings. They are generated from the syllable/ending pools in names.json and are not guaranteed to be real existing people.
