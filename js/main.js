/**
 * ============================================================================
 * FICHEIRO: main.js
 * RESPONSABILIDADE: Ponto de entrada principal (Entry Point) da aplicação.
 * É aqui que importamos todos os módulos, aguardamos o carregamento da página
 * e ligamos as ações do utilizador (cliques, digitação) às respetivas funções.
 * ============================================================================
 */

// 1. IMPORTAÇÕES (ES Modules)
// Trazemos as funções específicas de cada ficheiro modularizado.
import { toggleServiceDetails, addItem, calculateAndDisplayTotal, getFormData, populateForm } from './ui.js';
import { generatePrintableQuote } from './print.js';
import { fetchQuote, saveQuote } from './api.js';

/**
 * DOMContentLoaded garante que o JavaScript só começa a executar 
 * depois de todo o HTML da página estar totalmente desenhado e carregado.
 */
document.addEventListener('DOMContentLoaded', async function () {

    // ========================================================================
    // LIGAÇÃO DOS BOTÕES PRINCIPAIS (Event Listeners de Clique)
    // ========================================================================

    // Botão de adicionar nova peça/material dinâmico à tabela
    document.getElementById('btn-add-item').addEventListener('click', () => addItem());

    // Botão de Gerar PDF / Impressão
    const btnPrint = document.getElementById('btn-print');
    if (btnPrint) btnPrint.addEventListener('click', generatePrintableQuote);

    // Botão de Salvar/Atualizar na Base de Dados
    const btnSaveDb = document.getElementById('btn-save-db');
    if (btnSaveDb) {
        btnSaveDb.addEventListener('click', async () => {
            // Primeiro, recolhe todos os dados validados da tela (ui.js)
            const dados = getFormData();
            
            if (dados) {
                // Verifica se o botão tem um 'data-edit-id' oculto (se tiver, é um UPDATE, senão é INSERT)
                const editId = btnSaveDb.dataset.editId;
                // Envia para o PHP através do módulo da API (api.js)
                await saveQuote(dados, editId);
            }
        });
    }

    // ========================================================================
    // LIGAÇÃO DOS INPUTS DINÂMICOS (Recálculo Automático)
    // ========================================================================

    // Quando o utilizador digita nos "Custos Extras", o total é recalculado imediatamente
    document.getElementById('outros_valores').addEventListener('input', calculateAndDisplayTotal);

    // Percorre todos os blocos de serviços (Câmeras, Cerca, etc.)
    document.querySelectorAll('.service-block').forEach(groupDiv => {
        const checkbox = groupDiv.querySelector('.service-block__checkbox');
        const valorInput = groupDiv.querySelector('.service-block__price');
        
        // Se existir um checkbox neste bloco, escuta quando ele é marcado/desmarcado
        if (checkbox) {
            checkbox.addEventListener('change', function () {
                toggleServiceDetails(this); // Mostra/oculta a caixa de detalhes
                calculateAndDisplayTotal(); // Recalcula o total
            });
        }
        
        // Se existir um campo de preço, recalcula o total sempre que o utilizador digitar nele
        if (valorInput) valorInput.addEventListener('input', calculateAndDisplayTotal);
    });

    // ========================================================================
    // MODO DE EDIÇÃO (REHYDRATION) vs MODO DE CRIAÇÃO
    // ========================================================================

    // Lê a barra de endereços do navegador à procura do parâmetro '?id=' (Ex: index.html?id=5)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');

    if (editId) {
        // --- MODO EDIÇÃO ---
        // 1. Vai à base de dados buscar o orçamento com este ID
        const orcData = await fetchQuote(editId);
        
        if (orcData) {
            // 2. Se encontrou, preenche todo o formulário (inputs, tabela, checkboxes)
            populateForm(orcData);
            
            // 3. Adapta a Interface Visual para indicar que estamos a atualizar
            btnSaveDb.innerHTML = "💾 Atualizar Orçamento";
            // Substitui a classe amarela de aviso (warning) pela azul principal (primary) do padrão BEM
            btnSaveDb.classList.replace('button--warning', 'button--primary');
            // Guarda o ID no botão, para quando o utilizador clicar em Salvar
            btnSaveDb.dataset.editId = editId;
            
            // 4. Muda o título principal da página
            document.getElementById('main-title').textContent = `A Editar Orçamento #${editId}`;
        }
    } else {
        // --- MODO CRIAÇÃO (NOVO) ---
        // Apenas preenche o campo de "Data do Orçamento" com a data de hoje formatada (YYYY-MM-DD)
        document.getElementById('orcamento_data').value = new Date().toISOString().split('T')[0];
    }
});