# Lernivox — Product Requirements & Vision

## 1. Product Vision
Lernivox is an AI-powered academic learning companion that bridges textbooks, lecture materials, and academic papers with high-retention study workflows. Instead of generating ungrounded answers or hallucinated study aids, Lernivox anchors every summary, quiz question, flashcard, and tutor interaction to verifiable citations directly within source material.

---

## 2. Target Personas
- **University & College Students**: Balancing dense course textbooks, slides, and exam preparation with limited study time.
- **Lifelong Learners & Professional Students**: Studying technical certifications, medicine, or law requiring verifiable evidence and precise concept recall.
- **Study Groups**: Collaborating on shared course materials and comparing mastery.

---

## 3. Core Product Workflows

### A. Document Ingestion & Source Grounding
1. **Multi-Format Ingestion**: Students upload course textbooks, lecture slides, and notes in PDF and DOCX formats.
2. **Text & Structure Extraction**: Documents are parsed into clean text chunks with metadata preserving chapters, section headings, and page numbers.
3. **Semantic Vector Search**: Text chunks are indexed into PostgreSQL using the `pgvector` extension.
4. **Verifiable Citations**: Every generated study aid or tutor answer contains clickable citations referencing the exact chapter, page, and excerpt from the original document.

### B. Interactive AI Study Tutor
1. **Grounded Socratic Tutoring**: The AI tutor answers student questions strictly based on the uploaded course documents.
2. **Confidence & Hallucination Prevention**: If a concept is not covered in the student's material, the tutor states this explicitly rather than inventing facts.
3. **Citation Highlighting**: Tapping a citation shows the original source text snippet for immediate verification.

### C. Automated Quiz & Flashcard Generation
1. **Chapter-Linked Quizzes**: Generates multiple-choice and short-answer quizzes covering key learning objectives from uploaded documents.
2. **Detailed Explanations**: Explanations cite the source chapter and paragraph confirming the correct answer.
3. **Spaced-Repetition Flashcards**: Generates flashcards with automated scheduling based on mastery level.

### D. Learning Progress & Exam Readiness
1. **Concept Mastery Score**: Quantifies topic comprehension across course chapters.
2. **Diagnostic Gap Analysis**: Identifies weak chapters and concepts before exam deadlines.
3. **Personalized Revision Planner**: Generates daily revision sessions prioritizing difficult topics.

### E. Collaborative Study Groups
1. **Shared Course Workspaces**: Study groups share common document repositories.
2. **Group Quizzes**: Real-time or asynchronous quiz challenges to practice with peers.
