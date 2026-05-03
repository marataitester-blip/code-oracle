import CodeAltar from "@/components/CodeAltar";
import OracleChat from "@/components/OracleChat";

export default function CodeOracleManifestation() {
    const initialCodeContext = `// Пространство для алхимии кода подготовлено.
// Ожидание подключения к Хроникам Акаши (GitHub).
// 
// Введи свой PAT (Personal Access Token) для инициации.`;

    return (
        <main className="flex h-screen w-screen overflow-hidden bg-black text-gray-100 font-sans selection:bg-purple-900 selection:text-white">
            {/* Левая полусфера: Чат с ИИ */}
            <section className="w-1/3 min-w-[350px] max-w-[500px] h-full flex flex-col z-10">
                <OracleChat />
            </section>

            {/* Правая полусфера: Браузерный редактор и структура */}
            <section className="flex-grow h-full flex flex-col relative z-0">
                <CodeAltar code={initialCodeContext} />
            </section>
        </main>
    );
}
