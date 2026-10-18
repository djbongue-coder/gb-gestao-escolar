import CrudPage from "@/components/CrudPage";
import { trpc } from "@/lib/trpc";

const provinceNames: Record<number, string> = {
  1: "Bengo", 2: "Benguela", 3: "Bié", 4: "Cabinda", 5: "Cuando-Cubango",
  6: "Cuanza Norte", 7: "Cuanza Sul", 8: "Cunene", 9: "Huambo", 10: "Huíla",
  11: "Luanda", 12: "Lunda Norte", 13: "Lunda Sul", 14: "Malanje", 15: "Moxico",
  16: "Namibe", 17: "Uíge", 18: "Zaire",
};

const config = {
  title: "Municípios de Angola",
  description: "Os 164 municípios oficiais de Angola",
  listKey: "angolaMunicipalities",
  createKey: "angolaMunicipalities",
  updateKey: "angolaMunicipalities",
  deleteKey: "angolaMunicipalities",
  columns: [
    { key: "name", label: "Nome do Município", type: "text" as const, required: true },
    {
      key: "provinceId",
      label: "Província",
      type: "select" as const,
      options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18"],
      render: (v: any) => provinceNames[v as number] ?? `Província ${v}`,
    },
  ],
};

export default function MunicipalitiesPage() {
  return <CrudPage config={config as any} />;
}
