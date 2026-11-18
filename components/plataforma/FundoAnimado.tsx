/**
 * Fundo animado da plataforma, só com CSS (as animações ficam em app/globals.css):
 * grade em perspectiva deslizando, luzes "aurora" que se deslocam e
 * trechos de código subindo pela tela. Fica atrás do conteúdo, não recebe cliques e
 * para tudo quando a pessoa pede "reduzir movimento" no sistema.
 *
 * As posições são fixas (sem Math.random) para o HTML do servidor e do navegador baterem.
 */

const TRECHOS = [
  "</>", "git push", "{ }", "npm run dev", "def solve():", "0101", "=> deploy", "fn main()",
  "SELECT *", "import ia", "await api()", "#hackathon", "[ ]", "200 OK", "pip install", "<Equipe />",
  "λ", "merge ✓",
];

// [esquerda %, duração s, atraso s, tamanho px]
const POSICOES: [number, number, number, number][] = [
  [4, 26, 0, 15], [12, 32, 9, 13], [19, 24, 4, 17], [27, 35, 15, 14], [34, 29, 2, 13],
  [41, 38, 20, 16], [48, 27, 7, 14], [55, 33, 12, 13], [62, 25, 1, 15], [69, 36, 17, 14],
  [76, 28, 5, 17], [83, 31, 11, 13], [90, 26, 19, 15], [96, 34, 3, 14], [8, 37, 23, 14],
  [37, 30, 26, 15], [58, 39, 29, 13], [79, 33, 24, 16],
];

export default function FundoAnimado({ intensidade = "normal" }: { intensidade?: "normal" | "suave" }) {
  return (
    <div
      aria-hidden="true"
      className={`fundo-animado pointer-events-none fixed inset-0 -z-10 overflow-hidden ${
        intensidade === "suave" ? "opacity-75" : ""
      }`}
    >
      <div className="fundo-grade" />

      <div className="fundo-aurora fundo-aurora-1" />
      <div className="fundo-aurora fundo-aurora-2" />
      <div className="fundo-aurora fundo-aurora-3" />

      {TRECHOS.map((texto, i) => {
        const [esquerda, duracao, atraso, tamanho] = POSICOES[i % POSICOES.length];
        return (
          <span
            key={i}
            className="fundo-trecho"
            style={{
              left: `${esquerda}%`,
              fontSize: tamanho,
              animationDuration: `${duracao}s`,
              animationDelay: `-${atraso}s`,
            }}
          >
            {texto}
          </span>
        );
      })}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--fundo-pagina)_100%)]" />
    </div>
  );
}
