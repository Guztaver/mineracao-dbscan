# Pulso — Monitor de anomalias de consumo

Aplicação didática que usa DBSCAN para sinalizar leituras de consumo elétrico fora do padrão em relação ao horário informado. A interface recebe uma leitura manual ou um CSV e retorna o resultado com um gráfico.

## Integrantes

- Alex Gabriel Alves dos Santos
- Gustavo Muniz dos Anjos

## Acesso ao projeto

- **Site publicado:** <https://guztaver.github.io/mineracao-dbscan/>
- **Repositório:** <https://github.com/Guztaver/mineracao-dbscan>
- **Relatório:** [`report/relatorio.pdf`](report/relatorio.pdf) e fonte em [`report/relatorio.md`](report/relatorio.md)

## Rodar localmente

Requer Python 3.11 ou superior. O projeto usa apenas a biblioteca padrão do Python, sem instalação de pacotes.

```bash
python -m src.generate_data
python -m src.model
python app.py
```

Abra `http://127.0.0.1:8501`. O conjunto gerado e o modelo ficam em `data/` e `artifacts/`. O servidor carrega o modelo JSON salvo e não o treina a cada acesso. Para alterar a porta, defina a variável `PORT` antes de iniciar.

## Dados e geração

O arquivo `data/leituras_consumo.csv` contém 1.600 linhas sintéticas. O script `src/generate_data.py` cria um horário contínuo entre 0 e 24 e calcula o consumo com uma curva-base de baixa demanda de madrugada, picos pela manhã e à noite, e ruído normal com desvio de 0,16 kWh. Em 6% das linhas, substitui o consumo por um pico de 2,2 a 5 kWh acima da curva ou por uma leitura baixa de 0,02 a 0,08 kWh. A semente aleatória fixa (42) torna a geração reproduzível. Os dados não são medições reais.

## Técnica e validação

O modelo implementa DBSCAN (`eps=0.42`, `min_samples=12`) em Python puro sobre hora e consumo padronizados. A avaliação separa 80% para ajuste e 20% para teste. Como DBSCAN não tem método nativo `predict`, a aplicação associa uma nova leitura ao rótulo do ponto central (core point) mais próximo dentro de `eps`; se nenhum núcleo estiver nesse raio, marca como ruído. A métrica no teste mede detecção de anomalias conforme o rótulo conhecido pelo gerador, e não comprova desempenho em residências reais. Métricas, escala, pontos centrais e parâmetros são armazenados em `artifacts/dbscan_consumo.json`.

## Entrada e validação

- Hora: de 0 a 23,99 (hora decimal; 8,5 = 8h30).
- Consumo: de 0 a 50 kWh.
- CSV em lote: cabeçalhos obrigatórios `hora` e `consumo_kwh`; valores ausentes e faixas inválidas são rejeitados.

## Estrutura

```text
app.py                   servidor local sem dependências externas
index.html, styles.css   interface responsiva
app.js                   interface, validação, inferência e mapa de densidade
app-data.js              dados e pontos centrais para a versão estática
fonts/                   Barlow Semi Condensed local, licenciada em SIL OFL 1.1
src/generate_data.py     gerador de dados reproduzíveis
src/model.py             treino, avaliação, persistência e inferência DBSCAN
data/                    CSV usado pelo site
artifacts/               modelo DBSCAN salvo em JSON
dist/                    arquivos estáticos prontos para hospedagem
notebooks/               notebook de treino e avaliação
report/                  relatório do projeto
```

## Uso de IA

ChatGPT foi usado como apoio para estruturar o código, revisar a documentação e sugerir a apresentação dos resultados. Os integrantes devem revisar cada parte, executar a aplicação e conseguir explicar a geração dos dados, a padronização, os parâmetros, a regra de inferência e as limitações. Nenhuma senha, chave ou dado pessoal está incluído.

## Divisão de tarefas

**Alex Gabriel Alves dos Santos** — implementou o gerador do conjunto sintético, a preparação e a padronização dos dados, o DBSCAN, a avaliação holdout e a persistência dos pontos centrais e métricas.

**Gustavo Muniz dos Anjos** — implementou a interface do site, os formulários e a validação das entradas individuais e CSV, a visualização dos resultados e a publicação estática com GitHub Pages.

**Ambos** — definiram o problema e as regras de simulação, revisaram as métricas e limitações, organizaram a documentação e prepararam a apresentação.

## Fonte

Dados gerados pela própria dupla por meio de `src/generate_data.py`; não há dataset externo.
