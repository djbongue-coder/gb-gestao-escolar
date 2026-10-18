import CrudPage from "@/components/CrudPage";

const config = {
  title: "Recibos",
  description: "Gestão de recibos de pagamento",
  listKey: "receipts",
  createKey: "receipts",
  updateKey: "receipts",
  deleteKey: "receipts",
  columns: [{"key": "invoiceId", "label": "Factura ID", "type": "number"}, {"key": "amount", "label": "Valor Pago", "type": "number", "required": true}, {"key": "paymentMethod", "label": "Método", "type": "enum", "options": ["dinheiro", "transferencia", "multicaixa", "cheque"]}, {"key": "paymentDate", "label": "Data Pagamento", "type": "date"}, {"key": "receivedBy", "label": "Recebido Por", "type": "text"}, ],
};

export default function ReceiptsPage() {
  return <CrudPage config={config as any} />;
}
