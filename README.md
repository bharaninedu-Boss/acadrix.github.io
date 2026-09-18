# ACADRIX — Engineering Study Hub

ACADRIX is a GitHub Pages study-resource portal for engineering students. The website keeps curriculum/navigation data lightweight and uses GitHub-hosted PDFs as the primary large-resource format.

## PDF-first architecture

**New rule: upload the PDF to GitHub and that's it.**

For Mechanical Engineering, upload each PDF into one of these category folders:

`data/pdfs/mechanical/<regulation>/sem<semester>/<subject-code>/<category>/`

Supported categories:
- `notes/` — Notes / Study Materials
- `pyq/` — Previous Year Question Papers
- `important-questions/` — Important Questions
- `syllabus/` — Syllabus
- `lab-manual/` — Lab Manual / Practical Resources

Examples:
- `data/pdfs/mechanical/r2025/sem2/MA25C02/notes/`
- `data/pdfs/mechanical/r2025/sem2/MA25C02/pyq/`
- `data/pdfs/mechanical/r2025/sem1/MA25C01/important-questions/`
- `data/pdfs/mechanical/r2025/sem1/ME25C03/syllabus/`
- `data/pdfs/mechanical/r2021/sem5/ME3592/lab-manual/`

### Upload workflow
1. Open the repository on GitHub.
2. Open the correct subject and category folder under `data/pdfs/`.
3. Upload the PDF.
4. Commit to `main`.
5. GitHub Pages deploys it; the subject dashboard automatically discovers and lists it.

**No JSON editing is required for normal PDF resources.**

Clear filenames are recommended, such as `Unit_1_Notes.pdf`, `Full_Notes.pdf`, `Question_Paper_2024.pdf`, `Important_Questions.pdf`, `Lab_Manual.pdf` and `Syllabus.pdf`.

### Important technical note
GitHub Pages is a static host, so it cannot magically scan repository folders by itself. ACADRIX therefore reads the public GitHub Contents API at runtime. The subject page presents the five resource categories as tabs and discovers `.pdf` files from the corresponding GitHub folder. The actual PDF remains a normal GitHub file served by GitHub Pages.

## Existing academic data
Semester JSON files remain useful for lightweight curriculum information: subject code, subject name, credits, units and other navigation metadata. They should not contain large copied PDF text.

R-2025 has a separate 1-mark quiz/question-bank system. Those small structured JSON files remain in place because the quiz needs question/answer data; they are separate from the new PDF-first study-material workflow.

## Regulation separation
R-2025 and R-2021 Mechanical Engineering resources remain separate. PDF folders preserve the same separation.

## Site
`https://bharaninedu-boss.github.io/Acadrix/`

## Repository
`https://github.com/bharaninedu-Boss/acadrix.github.io`
