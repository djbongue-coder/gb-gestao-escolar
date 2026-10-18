import CrudPage from "@/components/CrudPage";

const config = {
  title: "Livros",
  description: "Gestão do acervo bibliográfico",
  listKey: "books",
  createKey: "books",
  updateKey: "books",
  deleteKey: "books",
  columns: [{"key": "title", "label": "Título", "type": "text", "required": true}, {"key": "author", "label": "Autor", "type": "text"}, {"key": "isbn", "label": "ISBN", "type": "text"}, {"key": "category", "label": "Categoria", "type": "enum", "options": ["didactico", "literatura", "referencia", "cientifico", "outro"]}, {"key": "quantity", "label": "Quantidade", "type": "number"}, {"key": "availableQuantity", "label": "Disponível", "type": "number"}, ],
};

export default function BooksPage() {
  return <CrudPage config={config as any} />;
}
