/**
 * ============================================================================
 * FICHEIRO: print.js
 * RESPONSABILIDADE: Gerar a versão de impressão (PDF) do orçamento.
 * Este ficheiro recolhe os dados da tela atual, constrói um HTML limpo
 * com CSS embutido e abre uma nova janela pronta para a impressora.
 * ============================================================================
 */

import { formatCurrency } from './calculos.js';

/**
 * Função principal que constrói e abre a janela de impressão.
 */
export function generatePrintableQuote() {
    // 1. RECOLHA DE DADOS BÁSICOS DO CLIENTE
    // Lê os valores digitados nos inputs principais do formulário
    const cliente = document.getElementById('cliente_nome').value;
    const endereco = document.getElementById('cliente_endereco').value;
    const telefone = document.getElementById('cliente_telefone').value;
    const data = document.getElementById('orcamento_data').value;
    const total = document.getElementById('total_orcamento').textContent;
    const observacoes = document.getElementById('observacoes').value;

    // 2. MAPEAMENTO DOS SERVIÇOS
    // Define a estrutura base dos serviços fixos para facilitar a organização por "Categorias" no papel
    const serviceItems = [
        { id: 'montagem', label: 'Montagem de computador', category: 'Montagem de equipamento' },
        { id: 'limpeza', label: 'Limpeza', category: 'Limpeza de computadores e perifericos' },
        { id: 'laudo', label: 'Laudo ou inspenção', category: 'laudo ou Inspenção' },
        { id: 'manutencao', label: 'Manutenção Geral', category: 'Manutenção' }
    ];

    // Objeto que vai agrupar os serviços escolhidos pelas suas respetivas categorias
    const categorizedServices = {};
    let servicosCount = 0; // Contador para saber se algum serviço foi marcado

    // Percorre os serviços mapeados para verificar quais foram selecionados pelo utilizador
    serviceItems.forEach(item => {
        const checkbox = document.getElementById(`serv_${item.id}`);
        
        if (checkbox && checkbox.checked) {
            // Se a categoria ainda não existe no objeto, cria um array vazio para ela
            if (!categorizedServices[item.category]) categorizedServices[item.category] = [];
            
            const valorInput = document.getElementById(`val_${item.id}`);
            const descTextarea = document.getElementById(`desc_${item.id}`);
            
            // Adiciona os detalhes do serviço ao array da sua categoria
            categorizedServices[item.category].push({
                label: item.label,
                valor: parseFloat(valorInput.value || 0),
                descricao: descTextarea ? descTextarea.value.trim() : ''
            });
            servicosCount++;
        }
    });

    // 3. CONSTRUÇÃO DO HTML DOS SERVIÇOS
    let servicosHtml = '';
    
    if (servicosCount > 0) {
        // Itera sobre cada categoria (Ex: "Montagem de equipamento", "laudo ou inspenção")
        for (const category in categorizedServices) {
            // Cria o cabeçalho da categoria
            servicosHtml += `<div class="category-box"><h3 class="category-title">${category}</h3><ul class="servicos-list">`;
            
            // Lista os serviços dentro dessa categoria
            categorizedServices[category].forEach(service => {
                servicosHtml += `<li class="servico-print-item">
                    <div class="servico-header"><span class="servico-nome">${service.label}</span><span class="servico-valor">${formatCurrency(service.valor)}</span></div>`;
                
                // Só adiciona o bloco de detalhes se o utilizador tiver digitado alguma coisa
                if (service.descricao) {
                    servicosHtml += `<div class="servico-detalhes">Detalhes: <span style="white-space: pre-wrap;">${service.descricao}</span></div>`;
                }
                servicosHtml += `</li>`;
            });
            servicosHtml += '</ul></div>';
        }
    } else {
        // Mensagem de fallback caso nenhum serviço principal seja selecionado
        servicosHtml = "<p>Nenhum serviço principal selecionado.</p>";
    }

    // 4. CONSTRUÇÃO DO HTML DOS MATERIAIS (Tabela Dinâmica)
    let itensHtml = '<table class="itens-table"><thead><tr><th>Descrição</th><th class="valor-col">Valor</th></tr></thead><tbody>';
    
    // Vasculha as linhas da tabela de itens na tela atual
    const itensRows = document.querySelectorAll('#itens_lista tr');
    
    if (itensRows.length > 0) {
        itensRows.forEach(row => {
            const rawValue = parseFloat(row.cells[1].textContent || 0);
            itensHtml += `<tr><td>${row.cells[0].textContent}</td><td class="valor-col">${formatCurrency(rawValue)}</td></tr>`;
        });
    } else {
        itensHtml += '<tr><td colspan="2" class="no-items">Nenhum material adicional incluído.</td></tr>';
    }
    itensHtml += '</tbody></table>';

    // 5. CUSTOS EXTRAS E OBSERVAÇÕES
    const outrosCustos = parseFloat(document.getElementById('outros_valores').value || 0);
    let obsHtml = '';
    
    if (observacoes.trim() !== '') {
        // O `white-space: pre-wrap` garante que as quebras de linha (Enter) dadas pelo utilizador apareçam no papel
        obsHtml = `<div class="category-box"><h3 class="category-title">Observações Adicionais</h3><div class="obs-box"><p style="white-space: pre-wrap;">${observacoes}</p></div></div>`;
    }

    // 6. GERAÇÃO DA NOVA JANELA E INJEÇÃO DE CÓDIGO
    // Abre uma nova aba em branco no navegador
    const printWindow = window.open('', '_blank');
    
    // Escreve o código HTML completo na nova aba, incluindo CSS focado exclusivamente para a impressora (@media print)
    printWindow.document.write(`
        <html><head><title>Orçamento - ${cliente}</title>
        <style>
            /* Variáveis de cor exclusivas para a impressão */
            :root { 
            --cor-primaria: #007bff; 
            --cor-fundo-sec: #f8f9fa; 
            --cor-total: #28a745; 
            --cor-texto: #343a40; 
            --cor-borda: #dee2e6; 
            }
            
            /* Reset e tipografia básica */
            body { 
            font-family: 'Segoe UI', Tahoma, sans-serif; 
            margin: 0; padding: 0; 
            color: var(--cor-texto); 
            background-color: #fff; 
            }
            
            /* Define o tamanho de uma folha A4 e centraliza o conteúdo */
            .document-container { 
            width: 210mm; 
            min-height: 297mm; 
            margin: 0 auto; 
            padding: 5mm; 
            box-sizing: border-box; 
            display: flex; 
            flex-direction: column; 
            }
            
            /* Estilos do cabeçalho da empresa */
            header { 
            text-align: left; 
            margin-bottom: 5px; 
            border-bottom: 2px solid var(--cor-primaria); 
            padding-bottom: 5px; 
            }
            header h1 { 
            color: var(--cor-primaria); 
            margin: 0 0 5px 0; 
            font-size: 2.2em; 
            }
            header p { 
            margin: 0; 
            font-size: 0.9em; 
            color: #6c757d; 
            }
            
            /* Faz com que o <main> empurre o <footer> para o final da página */
            main { flex: 1; }
            
            /* Estilo dos blocos (Caixas) */
            .section-container, .category-box {
            border: 1px solid var(--cor-borda); 
            border-radius: 8px; 
            margin-bottom: 5px; 
            background: #fff; 
            overflow: hidden; 
            }
            .category-title, .section-title { 
            background-color: var(--cor-fundo-sec); 
            padding: 5px 5px; 
            margin: 0; 
            font-size: 1.2em; 
            color: var(--cor-primaria); 
            border-bottom: 1px solid var(--cor-borda); 
            }
            .section-content, .info-grid { 
            padding: 5px; 
            }
            
            /* Grid para organizar os dados do cliente em colunas */
            .info-grid { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px; 
            }
            .info-item p { 
            margin: 0; 
            line-height: 1.4; 
            }
            
            /* Estilo da lista de serviços */
            .servicos-list { 
            list-style: none; 
            padding: 0 5px 5px 5px; 
            margin: 0; 
            }
            .servico-print-item { 
            padding: 10px 0; 
            border-bottom: 1px dashed var(--cor-borda); 
            }
            .servico-print-item:last-child { 
            border-bottom: none; 
            }
            .servico-header { 
            display: flex; 
            justify-content: space-between; 
            font-weight: 600; 
            font-size: 1.05em; 
            }
            .servico-valor { font-weight: 700; }
            .servico-detalhes { margin-top: 5px; font-size: 0.9em; color: #6c757d; padding-left: 15px; }
            
            /* Estilo da tabela de materiais para impressão */
            .itens-table { width: 100%; border-collapse: collapse; margin: -1px; }
            .itens-table th, .itens-table td { border: 1px solid var(--cor-borda); padding: 10px; text-align: left; }
            .itens-table th { background-color: var(--cor-primaria); color: white; font-weight: 400; }
            .itens-table tr:nth-child(even) { background-color: var(--cor-fundo-sec); }
            .itens-table .valor-col { text-align: right; width: 120px; font-weight: 600; }
            .itens-table .no-items { font-style: italic; color: #999; text-align: center; }
            
            /* Bloco de exibição do Total Geral */
            .total-box { text-align: right; margin-top: 25px; padding-top: 15px; border-top: 2px solid var(--cor-primaria); }
            .total-display { display: inline-block; background-color: var(--cor-total); color: white; padding: 10px 20px; font-size: 1.8em; font-weight: bold; border-radius: 6px; }
            .obs-box p { margin: 0; line-height: 1.6; font-size: 0.95em; padding: 0 15px 15px 15px;}
            
            /* Rodapé de contato da empresa */
            footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #ccc; font-size: 0.85em; color: #6c757d; text-align: center; }
            .validade { margin-bottom: 10px; font-style: italic; }
            .contact-info { font-weight: bold; color: var(--cor-primaria); }
            .contact-info p { margin: 2px 0; }
            
            /* * @media print: 
             * Instruções absolutas para quando o ecrã for enviado para o spooler da impressora ou para "Salvar como PDF".
             * Remove sombras, garante fundo branco e fixa cores.
             */
            @media print {
                @page { size: A4; margin: 0; } /* Zera as margens padrão do navegador */
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } /* Força a impressão das cores de fundo */
                .document-container { padding: 15mm; box-shadow: none; border: none; min-height: 270mm; }
                .info-grid { display: block; } .info-item { margin-bottom: 10px; }
                
                /* page-break-inside evita que um bloco corte ao meio entre a página 1 e 2 */
                .section-container, .category-box, .total-box, footer { page-break-inside: avoid; }
                
                * { color: #000 !important; } /* Força texto a preto para economizar tinta */
                header h1, .contact-info, .servico-valor, .category-title { color: var(--cor-primaria) !important; }
                .total-display { background-color: #e9ecef !important; color: #000 !important; border: 1px solid var(--cor-total); box-shadow: none; }
                .itens-table th { background-color: var(--cor-primaria) !important; color: white !important; }
            }
        </style></head><body>
            
            <div class="document-container">
                <header>
                    <h1>ORÇAMENTO DE SERVIÇOS</h1>
                    <p>Referente a serviço de informatica</p>
                </header>
                
                <main>
                    <div class="section-container">
                        <h3 class="section-title">Dados do Cliente</h3>
                        <div class="info-grid">
                            <div class="info-item"><p><strong>Cliente:</strong> ${cliente || 'Não informado'}</p></div>
                            <div class="info-item"><p><strong>Endereço:</strong> ${endereco || 'Não informado'}</p></div>
                            <div class="info-item" style="display: flex; justify-content: space-between; flex-wrap: wrap;">
                                <p><strong>Contato:</strong> ${telefone || 'Não informado'}</p>
                                <p><strong>Data:</strong> ${data ? new Date(data + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</p>
                            </div>
                        </div>
                    </div>
                    
                    ${servicosHtml}
                    
                    <div class="category-box">
                        <h3 class="category-title">Materiais e Peças Adicionais</h3>
                        ${itensHtml}
                    </div>
                    
                    <div class="category-box">
                        <h3 class="category-title">Custos Adicionais</h3>
                        <div class="section-content">
                            <div class="info-item"><p>Deslocamento/Taxas/Outros: <strong>${formatCurrency(outrosCustos)}</strong></p></div>
                        </div>
                    </div>
                    
                    ${obsHtml}
                </main>
                
                <div class="total-box">
                    <span class="total-display">TOTAL: ${total}</span>
                </div>
                
                <footer>
                    <div class="validade">Orçamento válido por 15 dias, sujeito a aprovação final.</div>
                    <div class="contact-info">
                        <p>-- Desenvolvido por Thiago gois --</p>
                        <p>thiago.gois.lira@gmail.com // Att. Thiago Gois</p>
                    </div>
                </footer>
            </div>
        </body></html>
    `);
    
    // 7. INICIA O COMANDO DE IMPRESSÃO
    // Fecha a edição do documento para que o navegador saiba que acabamos de enviar conteúdo
    printWindow.document.close();
    // Coloca a aba atual em foco
    printWindow.focus();
    
    // Aguarda 500ms (meio segundo) para garantir que o CSS e o layout foram carregados
    // pelo navegador antes de chamar o diálogo nativo de impressão (Ctrl+P)
    setTimeout(() => { printWindow.print(); }, 500);
}