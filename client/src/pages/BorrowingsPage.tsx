import CrudPage from "@/components/CrudPage";

const config = {
  title: "Empréstimos",
  description: "Gestão de empréstimos de livros",
  listKey: "borrowings",
  createKey: "borrowings",
  updateKey: "borrowings",
  deleteKey: "borrowings",
  columns: [{"key": "bookId", "label": "Livro ID", "type": "number"}, {"key": "studentId", "label": "Aluno ID", "type": "number"}, {"key": "borrowDate", "label": "Data Empréstimo", "type": "date"}, {"key": "dueDate", "label": "Data Devolução", "type": "date"}, {"key": "returnDate", "label": "Data de Devolução", "type": "date"}, {"key": "status", "label": "Estado", "type": "enum", "options": ["emprestado", "devolvido", "atrasado"]}, ],
};

export default function BorrowingsPage() {
  return <CrudPage config={config as any} />;
}
