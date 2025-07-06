// editar.js

document.addEventListener('DOMContentLoaded', () => {
    // Recupera o índice do animal a editar
    const idx = localStorage.getItem('editar_idx');
    let animais = JSON.parse(localStorage.getItem('animais')) || [];
    if (idx === null || !animais[idx]) {
        alert('Animal não encontrado!');
        window.location.href = 'index.html';
        return;
    }
    const animal = animais[idx];

    // Preenche o formulário
    document.getElementById('serie').value = animal.serie || '';
    document.getElementById('rg').value = animal.rg || '';
    document.getElementById('sexo').value = animal.sexo || '';
    document.getElementById('raca').value = animal.raca || '';
    document.getElementById('nascimento').value = animal.nascimento || '';
    document.getElementById('meses').value = animal.meses || '';
    document.getElementById('custo').value = animal.custo || '';
    document.getElementById('valor-venda').value = animal.venda || '';
    document.getElementById('tipo-servico').value = animal.movimentacao?.tipo || '';

    // Renderiza campos dinâmicos de movimentação
    function renderizarCamposMovimentacao(tipo, mov) {
        let html = '';
        if (tipo === 'Peso') {
            html = `<div class="mov-row">
                <label for="mov-peso-data">Data:</label>
                <input type="date" id="mov-peso-data" value="${mov?.data || ''}">
                <label for="mov-peso-valor">Peso (kg):</label>
                <input type="number" id="mov-peso-valor" step="0.01" value="${mov?.peso || ''}">
            </div>`;
        } else if (tipo === 'DG') {
            html = `<div class="mov-row">
                <label for="mov-dg-data">Data:</label>
                <input type="date" id="mov-dg-data" value="${mov?.data || ''}">
                <label for="mov-dg-vet">Veterinário:</label>
                <input type="text" id="mov-dg-vet" value="${mov?.veterinario || ''}" placeholder="Nome do veterinário">
                <label for="mov-dg-resultado">Resultado:</label>
                <input type="text" id="mov-dg-resultado" value="${mov?.resultado || ''}" placeholder="Resultado">
            </div>`;
        } else if (tipo === 'Exame') {
            html = `<div class="mov-row">
                <label for="mov-exame-data">Data:</label>
                <input type="date" id="mov-exame-data" value="${mov?.data || ''}">
                <label for="mov-exame-tipo">Exame:</label>
                <input type="text" id="mov-exame-tipo" value="${mov?.exame || ''}" placeholder="Tipo de exame">
                <label for="mov-exame-valor">Valor (R$):</label>
                <input type="number" id="mov-exame-valor" step="0.01" value="${mov?.valor || ''}">
            </div>`;
        } else if (tipo === 'Saida') {
            html = `<div class="mov-row">
                <label for="mov-saida-destino">Destino:</label>
                <input type="text" id="mov-saida-destino" value="${mov?.destino || ''}" placeholder="Destino">
                <label for="mov-saida-data">Data Saída:</label>
                <input type="date" id="mov-saida-data" value="${mov?.data || ''}">
                <label for="mov-saida-valor">Valor (R$):</label>
                <input type="number" id="mov-saida-valor" step="0.01" value="${mov?.valor || ''}">
            </div>`;
        } else if (tipo === 'Entrada') {
            html = `<div class="mov-row">
                <label for="mov-entrada-origem">De onde veio:</label>
                <input type="text" id="mov-entrada-origem" value="${mov?.origem || ''}" placeholder="Origem">
                <label for="mov-entrada-data">Data:</label>
                <input type="date" id="mov-entrada-data" value="${mov?.data || ''}">
                <label for="mov-entrada-fornecedor">Fornecedor:</label>
                <input type="text" id="mov-entrada-fornecedor" value="${mov?.fornecedor || ''}" placeholder="Fornecedor">
            </div>`;
        }
        document.getElementById('movimentacao-dinamica').innerHTML = html;
    }

    renderizarCamposMovimentacao(animal.movimentacao?.tipo || '', animal.movimentacao);

    document.getElementById('tipo-servico').addEventListener('change', function () {
        renderizarCamposMovimentacao(this.value, {});
    });

    // Salvar alterações
    document.getElementById('editar-animal-form').addEventListener('submit', function (e) {
        e.preventDefault();
        // Atualiza os dados do animal
        const tipoServico = document.getElementById('tipo-servico').value;
        let movimentacao = { tipo: tipoServico };
        if (tipoServico === 'Peso') {
            movimentacao.data = document.getElementById('mov-peso-data').value;
            movimentacao.peso = document.getElementById('mov-peso-valor').value;
        } else if (tipoServico === 'DG') {
            movimentacao.data = document.getElementById('mov-dg-data').value;
            movimentacao.veterinario = document.getElementById('mov-dg-vet').value;
            movimentacao.resultado = document.getElementById('mov-dg-resultado').value;
        } else if (tipoServico === 'Exame') {
            movimentacao.data = document.getElementById('mov-exame-data').value;
            movimentacao.exame = document.getElementById('mov-exame-tipo').value;
            movimentacao.valor = document.getElementById('mov-exame-valor').value;
        } else if (tipoServico === 'Saida') {
            movimentacao.destino = document.getElementById('mov-saida-destino').value;
            movimentacao.data = document.getElementById('mov-saida-data').value;
            movimentacao.valor = document.getElementById('mov-saida-valor').value;
        } else if (tipoServico === 'Entrada') {
            movimentacao.origem = document.getElementById('mov-entrada-origem').value;
            movimentacao.data = document.getElementById('mov-entrada-data').value;
            movimentacao.fornecedor = document.getElementById('mov-entrada-fornecedor').value;
        }
        animais[idx] = {
            serie: document.getElementById('serie').value,
            rg: document.getElementById('rg').value,
            sexo: document.getElementById('sexo').value,
            raca: document.getElementById('raca').value,
            nascimento: document.getElementById('nascimento').value,
            meses: document.getElementById('meses').value,
            custo: document.getElementById('custo').value,
            venda: document.getElementById('valor-venda').value,
            movimentacao
        };
        localStorage.setItem('animais', JSON.stringify(animais));
        alert('Alterações salvas!');
        window.location.href = 'index.html';
    });
});
