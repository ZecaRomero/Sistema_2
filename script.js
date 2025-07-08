document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("animal-form");
    const tabela = document.querySelector("#animal-table tbody");
    let animais = JSON.parse(localStorage.getItem("animais")) || [];

    // Elementos dos cards de resumo
    const totalAnimaisEl = document.getElementById("total-animais");
    const ultimoAnimalEl = document.getElementById("ultimo-animal");
    const fotoCardUltimo = document.getElementById('foto-card-ultimo');

    // Funções de validação e formatação por domínio
    const validadores = {
        serie: {
            validar: (valor) => {
                if (!valor || valor.trim() === '') return 'Série é obrigatória';
                if (valor.length < 3) return 'Série deve ter pelo menos 3 caracteres';
                if (valor.length > 20) return 'Série deve ter no máximo 20 caracteres';
                if (!/^[A-Za-z0-9\-_]+$/.test(valor)) return 'Série deve conter apenas letras, números, hífen e underscore';
                return null;
            },
            formatar: (valor) => valor.toUpperCase().trim()
        },
        rg: {
            validar: (valor) => {
                if (!valor || valor.trim() === '') return 'RG é obrigatório';
                if (valor.length < 1) return 'RG deve ter pelo menos 1 número';
                if (valor.length > 6) return 'RG deve ter no máximo 6 números';
                if (!/^[0-9]+$/.test(valor)) return 'RG deve conter apenas números';
                return null;
            },
            formatar: (valor) => valor.replace(/[^\d]/g, '').replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4')
        },
        sexo: {
            validar: (valor) => {
                if (!valor || valor === '') return 'Sexo é obrigatório';
                if (!['Fêmea', 'Macho'].includes(valor)) return 'Sexo deve ser Fêmea ou Macho';
                return null;
            },
            formatar: (valor) => valor
        },
        raca: {
            validar: (valor) => {
                if (!valor || valor.trim() === '') return 'Raça é obrigatória';
                if (valor.length < 2) return 'Raça deve ter pelo menos 2 caracteres';
                if (valor.length > 30) return 'Raça deve ter no máximo 30 caracteres';
                if (!/^[A-Za-zÀ-ÿ\s]+$/.test(valor)) return 'Raça deve conter apenas letras e espaços';
                return null;
            },
            formatar: (valor) => valor.trim().replace(/\s+/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        },
        valorVenda: {
            validar: (valor) => {
                if (!valor || valor === '') return 'Valor de venda é obrigatório';
                const num = parseFloat(valor);
                if (isNaN(num)) return 'Valor de venda deve ser um número válido';
                if (num < 0) return 'Valor de venda não pode ser negativo';
                if (num > 1000000) return 'Valor de venda não pode ser maior que R$ 1.000.000,00';
                return null;
            },
            formatar: (valor) => {
                const num = parseFloat(valor);
                return isNaN(num) ? 0 : num.toFixed(2);
            }
        }
    };

    // Função para aplicar validação em tempo real
    function aplicarValidacao(campo, tipo) {
        const input = document.getElementById(campo);
        const valor = input.value;
        const erro = validadores[tipo].validar(valor);

        // Remove classes de erro anteriores
        input.classList.remove('erro', 'sucesso');

        if (erro) {
            input.classList.add('erro');
            mostrarMensagemErro(input, erro);
        } else {
            input.classList.add('sucesso');
            removerMensagemErro(input);
        }

        return erro === null;
    }

    // Função para mostrar mensagem de erro
    function mostrarMensagemErro(input, mensagem) {
        removerMensagemErro(input);
        const erroDiv = document.createElement('div');
        erroDiv.className = 'erro-mensagem';
        erroDiv.textContent = mensagem;
        erroDiv.style.color = 'red';
        erroDiv.style.fontSize = '12px';
        erroDiv.style.marginTop = '2px';
        input.parentNode.appendChild(erroDiv);
    }

    // Função para remover mensagem de erro
    function removerMensagemErro(input) {
        const erroExistente = input.parentNode.querySelector('.erro-mensagem');
        if (erroExistente) {
            erroExistente.remove();
        }
    }

    // Adicionar listeners para validação em tempo real
    document.getElementById('serie').addEventListener('blur', () => aplicarValidacao('serie', 'serie'));
    document.getElementById('rg').addEventListener('blur', () => aplicarValidacao('rg', 'rg'));
    document.getElementById('sexo').addEventListener('change', () => aplicarValidacao('sexo', 'sexo'));
    document.getElementById('raca').addEventListener('blur', () => aplicarValidacao('raca', 'raca'));
    document.getElementById('valor-venda').addEventListener('blur', () => aplicarValidacao('valor-venda', 'valorVenda'));

    // Formatação automática do RG
    document.getElementById('rg').addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length <= 9) {
            valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        }
        e.target.value = valor;
    });

    // Formatação automática do valor de venda
    document.getElementById('valor-venda').addEventListener('input', (e) => {
        let valor = e.target.value.replace(/[^\d,.]/g, '');
        valor = valor.replace(',', '.');
        const num = parseFloat(valor);
        if (!isNaN(num)) {
            e.target.value = num.toFixed(2);
        }
    });

    // Bloquear caracteres não permitidos em série (apenas letras e números)
    document.getElementById('serie').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^A-Za-z0-9]/g, '');
    });
    // Bloquear caracteres não permitidos em meses (apenas números inteiros positivos)
    document.getElementById('meses').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '');
    });

    function salvarNoStorage() {
        localStorage.setItem("animais", JSON.stringify(animais));
    }

    // Navegação entre animais
    let animalSelecionadoIdx = animais.length > 0 ? animais.length - 1 : -1;
    const btnAnterior = document.getElementById('btn-anterior');
    const btnProximo = document.getElementById('btn-proximo');

    function renderizarResumo(idx) {
        if (totalAnimaisEl) totalAnimaisEl.textContent = animais.length;
        if (ultimoAnimalEl) {
            if (animais.length > 0 && idx >= 0 && idx < animais.length) {
                const animal = animais[idx];
                ultimoAnimalEl.textContent = `${animal.serie} (${animal.rg})`;
                // Exibir foto ao lado do card usando RG do animal selecionado
                const fotoPath = `fotos/${animal.rg}.jpg`;
                fotoImg.src = fotoPath;
                fotoImg.onload = function () {
                    fotoContainer.style.display = 'block';
                    fotoLabel.textContent = `Foto do animal RG: ${animal.rg}`;
                    fotoErro.style.display = 'none';
                };
                fotoImg.onerror = function () {
                    fotoContainer.style.display = 'block';
                    fotoImg.src = '';
                    fotoLabel.textContent = '';
                    fotoErro.style.display = 'none';
                };
            } else {
                ultimoAnimalEl.textContent = '-';
                fotoContainer.style.display = 'none';
                fotoImg.src = '';
                fotoLabel.textContent = '';
                fotoErro.style.display = 'none';
            }
        }
        // Habilitar/desabilitar botões
        btnAnterior.disabled = (animalSelecionadoIdx <= 0);
        btnProximo.disabled = (animalSelecionadoIdx >= animais.length - 1);
    }

    btnAnterior.addEventListener('click', () => {
        if (animalSelecionadoIdx > 0) {
            animalSelecionadoIdx--;
            renderizarResumo(animalSelecionadoIdx);
        }
    });
    btnProximo.addEventListener('click', () => {
        if (animalSelecionadoIdx < animais.length - 1) {
            animalSelecionadoIdx++;
            renderizarResumo(animalSelecionadoIdx);
        }
    });

    // Busca e filtros
    const buscaInput = document.getElementById('busca-animais');
    const filtroTodos = document.getElementById('filtro-todos');
    const filtroLucro = document.getElementById('filtro-lucro');
    const filtroPrejuizo = document.getElementById('filtro-prejuizo');
    const resumoLista = document.getElementById('resumo-lista');
    let filtroAtual = 'todos';
    let buscaAtual = '';
    let idxSelecionado = -1;

    function atualizarResumoLista(animaisFiltrados) {
        const total = animaisFiltrados.length;
        const lucro = animaisFiltrados.filter(a => parseFloat(a.venda) - parseFloat(a.custo) >= 0).length;
        const preju = animaisFiltrados.filter(a => parseFloat(a.venda) - parseFloat(a.custo) < 0).length;
        const somaLucro = animaisFiltrados.reduce((s, a) => s + Math.max(0, parseFloat(a.venda) - parseFloat(a.custo)), 0);
        const somaPreju = animaisFiltrados.reduce((s, a) => s + Math.min(0, parseFloat(a.venda) - parseFloat(a.custo)), 0);
        resumoLista.innerHTML = `Total: <b>${total}</b> &nbsp;|&nbsp; Lucro: <b style='color:#388e3c;'>${lucro}</b> (R$ ${somaLucro.toFixed(2)}) &nbsp;|&nbsp; Prejuízo: <b style='color:#d32f2f;'>${preju}</b> (R$ ${somaPreju.toFixed(2)})`;
    }

    function getAnimaisFiltrados() {
        let filtrados = animais;
        if (buscaAtual) {
            const termo = buscaAtual.toLowerCase();
            filtrados = filtrados.filter(a =>
                (a.serie && a.serie.toLowerCase().includes(termo)) ||
                (a.rg && a.rg.toLowerCase().includes(termo)) ||
                (a.raca && a.raca.toLowerCase().includes(termo))
            );
        }
        if (filtroAtual === 'lucro') {
            filtrados = filtrados.filter(a => parseFloat(a.venda) - parseFloat(a.custo) >= 0);
        } else if (filtroAtual === 'prejuizo') {
            filtrados = filtrados.filter(a => parseFloat(a.venda) - parseFloat(a.custo) < 0);
        }
        return filtrados;
    }

    function renderizarTabela() {
        tabela.innerHTML = "";
        const animaisFiltrados = getAnimaisFiltrados();
        atualizarResumoLista(animaisFiltrados);
        animaisFiltrados.forEach((animal, index) => {
            const linha = document.createElement("tr");
            const lucroPrejuizo = parseFloat(animal.venda) - parseFloat(animal.custo);
            const classeLucro = lucroPrejuizo >= 0 ? 'lucro' : 'prejuizo';
            linha.innerHTML = `
                <td>${animal.serie}</td>
                <td>${animal.rg}</td>
                <td>${animal.sexo}</td>
                <td>${animal.raca}</td>
                <td>R$ ${parseFloat(animal.custo).toFixed(2)}</td>
                <td>R$ ${parseFloat(animal.venda).toFixed(2)}</td>
                <td class="${classeLucro} lucro-prejuizo-cell" style="cursor:pointer;" data-index="${animais.indexOf(animal)}" title="Clique para ver o detalhamento">R$ ${lucroPrejuizo.toFixed(2)}</td>
                <td class="actions">
                    <button onclick="editarAnimal(${animais.indexOf(animal)})">Editar</button>
                    <button onclick="excluirAnimal(${animais.indexOf(animal)})">Excluir</button>
                </td>
            `;
            if (idxSelecionado === animais.indexOf(animal)) linha.classList.add('linha-selecionada');
            tabela.appendChild(linha);
        });
        animalSelecionadoIdx = animais.length > 0 ? animais.length - 1 : -1;
        renderizarResumo(animalSelecionadoIdx);
        document.querySelectorAll('.lucro-prejuizo-cell').forEach(cell => {
            cell.addEventListener('click', function () {
                const idx = parseInt(this.getAttribute('data-index'));
                const animal = animais[idx];
                const lucroPrejuizo = parseFloat(animal.venda) - parseFloat(animal.custo);
                idxSelecionado = idx;
                abrirModalDetalhe(animal, lucroPrejuizo, idx);
                renderizarTabela();
            });
        });
    }

    window.editarAnimal = function (index) {
        // Redireciona para página de edição
        localStorage.setItem('editar_idx', index);
        window.location.href = 'editar.html';
    }

    window.excluirAnimal = function (index) {
        if (confirm("Tem certeza que deseja excluir este animal?")) {
            animais.splice(index, 1);
            salvarNoStorage();
            renderizarTabela();
        }
    }

    // Movimentação dinâmica
    const tipoServicoEl = document.getElementById('tipo-servico');
    const movDinamicaEl = document.getElementById('movimentacao-dinamica');

    // Mapeamento dos campos por tipo de serviço
    const camposPorTipo = {
        "Peso": [
            { label: "Data", id: "mov-peso-data", type: "date", required: true },
            { label: "Peso (kg)", id: "mov-peso-valor", type: "number", step: "0.01", required: true },
            { label: "Local", id: "mov-peso-local", type: "text", required: false }
        ],
        "Diagnóstico de Gestação": [
            { label: "Data", id: "mov-dg-data", type: "date", required: true },
            { label: "Resultado", id: "mov-dg-resultado", type: "text", required: true }
        ],
        "Exame": [
            { label: "Data", id: "mov-exame-data", type: "date", required: true },
            { label: "Tipo de Exame", id: "mov-exame-tipo", type: "text", required: true },
            { label: "Resultado", id: "mov-exame-resultado", type: "text", required: false }
        ],
        "Saída": [
            { label: "Data Saída", id: "mov-saida-data", type: "date", required: true },
            { label: "Destino", id: "mov-saida-destino", type: "text", required: true },
            { label: "Motivo", id: "mov-saida-motivo", type: "text", required: false }
        ],
        "Entrada": [
            { label: "Data", id: "mov-entrada-data", type: "date", required: true },
            { label: "Origem", id: "mov-entrada-origem", type: "text", required: true },
            { label: "Fornecedor", id: "mov-entrada-fornecedor", type: "text", required: false }
        ],
        "Vacina": [
            { label: "Data", id: "mov-vacina-data", type: "date", required: true },
            { label: "Tipo de Vacina", id: "mov-vacina-tipo", type: "text", required: true }
        ],
        "Vermifugacao": [
            { label: "Data", id: "mov-vermifugacao-data", type: "date", required: true },
            { label: "Produto", id: "mov-vermifugacao-produto", type: "text", required: true }
        ],
        "Transferencia": [
            { label: "Data", id: "mov-transferencia-data", type: "date", required: true },
            { label: "Origem", id: "mov-transferencia-origem", type: "text", required: true },
            { label: "Destino", id: "mov-transferencia-destino", type: "text", required: true }
        ],
        "Cobricao": [
            { label: "Data", id: "mov-cobricao-data", type: "date", required: true },
            { label: "Touro", id: "mov-cobricao-touro", type: "text", required: true }
        ],
        "Outro": [
            { label: "Data", id: "mov-outro-data", type: "date", required: true },
            { label: "Tipo de Serviço", id: "mov-outro-tipo", type: "text", required: true },
            { label: "Descrição", id: "mov-outro-desc", type: "text", required: false }
        ],
        "Brinco": [
            { label: "Data", id: "mov-brinco-data", type: "date", required: true },
            { label: "Valor (R$)", id: "mov-brinco-valor", type: "number", step: "0.01", required: true }
        ]
    };

    function renderizarCamposMovimentacao(tipo) {
        const container = document.getElementById('movimentacao-dinamica');
        container.innerHTML = '';
        const campos = camposPorTipo[tipo] || [];
        campos.forEach(campo => {
            const div = document.createElement('div');
            div.className = 'form-row';
            const label = document.createElement('label');
            label.htmlFor = campo.id;
            label.textContent = campo.label + (campo.required ? ' *' : '');
            const input = document.createElement('input');
            input.type = campo.type;
            input.id = campo.id;
            input.name = campo.id;
            if (campo.step) input.step = campo.step;
            if (campo.required) input.required = true;
            div.appendChild(label);
            div.appendChild(input);
            container.appendChild(div);
        });
    }

    // Formatação automática do RG
    document.getElementById('rg').addEventListener('input', (e) => {
        let valor = e.target.value.replace(/\D/g, '');
        if (valor.length <= 9) {
            valor = valor.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
        }
        e.target.value = valor;
    });

    // Formatação automática do valor de venda
    document.getElementById('valor-venda').addEventListener('input', (e) => {
        let valor = e.target.value.replace(/[^\d,.]/g, '');
        valor = valor.replace(',', '.');
        const num = parseFloat(valor);
        if (!isNaN(num)) {
            e.target.value = num.toFixed(2);
        }
    });

    // Bloquear caracteres não permitidos em RG (apenas 1 a 6 números)
    document.getElementById('rg').addEventListener('input', function (e) {
        this.value = this.value.replace(/[^0-9]/g, '').slice(0, 6);
    });

    // Modal de detalhamento
    const modal = document.getElementById('modal-detalhe');
    const modalContent = document.getElementById('modal-detalhe-content');
    const modalFechar = document.getElementById('modal-detalhe-fechar');
    const modalFoto = document.getElementById('modal-detalhe-foto');
    const modalTitulo = document.getElementById('modal-detalhe-titulo');
    const modalInfo = document.getElementById('modal-detalhe-info');
    const modalLucro = document.getElementById('modal-detalhe-lucro');
    const modalIcone = document.getElementById('modal-detalhe-icone');
    const modalExtra = document.getElementById('modal-detalhe-extra');
    const modalAnterior = document.getElementById('modal-detalhe-anterior');
    const modalProximo = document.getElementById('modal-detalhe-proximo');

    let idxModal = 0;
    function abrirModalDetalhe(animal, lucroPrejuizo, idx) {
        idxModal = idx;
        // Ícone e borda
        const cor = lucroPrejuizo >= 0 ? '#388e3c' : '#d32f2f';
        const bg = lucroPrejuizo >= 0 ? '#e8f5e8' : '#ffebee';
        const icone = lucroPrejuizo >= 0 ? '🟢' : '🔴';
        modalIcone.innerHTML = icone;
        modalContent.style.borderColor = bg;
        // Foto
        const fotoPath = `fotos/${animal.rg}.jpg`;
        modalFoto.innerHTML = `<img id="modal-foto-img" src="${fotoPath}" alt="Foto do animal" style="max-width:120px; max-height:90px; border-radius:8px; border:1.5px solid #ccc; margin-bottom:0.3rem;">`;
        const fotoImg = document.getElementById('modal-foto-img');
        fotoImg.onerror = function () {
            modalFoto.innerHTML = `<div id='modal-foto-loading' style='color:#bbb; font-size:2.2rem; margin-bottom:0.2rem;'><span class='loader'></span></div>`;
            setTimeout(() => {
                modalFoto.innerHTML = `<div style='color:#bbb; font-size:2.2rem; margin-bottom:0.2rem;'>📷</div><div style='font-size:1.05rem; color:#d32f2f; font-weight:600; margin-top:0.2rem;'>Foto não disponível para este animal</div>`;
            }, 1000);
        };
        // Título
        modalTitulo.textContent = `${animal.serie} (${animal.rg})`;
        // Info
        modalInfo.innerHTML = `Sexo: <b>${animal.sexo}</b> &nbsp;|&nbsp; Raça: <b>${animal.raca}</b><br>Custo: <b>R$ ${parseFloat(animal.custo).toFixed(2)}</b> &nbsp;|&nbsp; Venda: <b>R$ ${parseFloat(animal.venda).toFixed(2)}</b>`;
        // Extra
        let extra = '';
        if (animal.nascimento) extra += `Nascimento: <b>${animal.nascimento}</b> &nbsp;|&nbsp;`;
        if (animal.meses) extra += `Meses: <b>${animal.meses}</b> &nbsp;|&nbsp;`;
        if (animal.movimentacao && animal.movimentacao.tipo) extra += `Tipo de Serviço: <b>${animal.movimentacao.tipo}</b>`;
        modalExtra.innerHTML = extra;
        // Lucro/prejuízo
        modalLucro.innerHTML = `<span style="color:${cor}; background:${bg}; padding:0.3rem 0.7rem; border-radius:6px;">${lucroPrejuizo >= 0 ? '✔️ Lucro' : '⚠️ Prejuízo'}: R$ ${lucroPrejuizo.toFixed(2)}</span>`;
        modal.style.display = 'flex';
        setTimeout(() => { modal.style.opacity = 1; }, 10);
        // Habilitar/desabilitar setas
        modalAnterior.disabled = (idx <= 0);
        modalProximo.disabled = (idx >= animais.length - 1);
        // Tooltip no ícone
        modalIcone.title = `Cálculo: Venda (${parseFloat(animal.venda).toFixed(2)}) - Custo (${parseFloat(animal.custo).toFixed(2)}) = ${lucroPrejuizo.toFixed(2)}`;
    }
    modalFechar.onclick = () => { modal.style.opacity = 0; setTimeout(() => { modal.style.display = 'none'; }, 250); };
    modal.onclick = (e) => { if (e.target === modal) { modal.style.opacity = 0; setTimeout(() => { modal.style.display = 'none'; }, 250); } };
    modalAnterior.onclick = () => {
        if (idxModal > 0) {
            const animal = animais[idxModal - 1];
            const lucroPrejuizo = parseFloat(animal.venda) - parseFloat(animal.custo);
            abrirModalDetalhe(animal, lucroPrejuizo, idxModal - 1);
        }
    };
    modalProximo.onclick = () => {
        if (idxModal < animais.length - 1) {
            const animal = animais[idxModal + 1];
            const lucroPrejuizo = parseFloat(animal.venda) - parseFloat(animal.custo);
            abrirModalDetalhe(animal, lucroPrejuizo, idxModal + 1);
        }
    };
    document.addEventListener('keydown', function (e) {
        if (modal.style.display === 'flex' && (e.key === 'Escape' || e.key === 'Esc')) {
            modal.style.opacity = 0; setTimeout(() => { modal.style.display = 'none'; }, 250);
        }
    });

    buscaInput.addEventListener('input', function () {
        buscaAtual = this.value;
        renderizarTabela();
    });
    filtroTodos.addEventListener('click', function () {
        filtroAtual = 'todos';
        filtroTodos.classList.add('active');
        filtroLucro.classList.remove('active');
        filtroPrejuizo.classList.remove('active');
        renderizarTabela();
    });
    filtroLucro.addEventListener('click', function () {
        filtroAtual = 'lucro';
        filtroTodos.classList.remove('active');
        filtroLucro.classList.add('active');
        filtroPrejuizo.classList.remove('active');
        renderizarTabela();
    });
    filtroPrejuizo.addEventListener('click', function () {
        filtroAtual = 'prejuizo';
        filtroTodos.classList.remove('active');
        filtroLucro.classList.remove('active');
        filtroPrejuizo.classList.add('active');
        renderizarTabela();
    });

    renderizarTabela();
});

// Tipos de serviço iniciais
let tiposServico = ["Peso", "Diagnóstico de Gestação", "Exame", "Saída", "Entrada", "Vacina", "Vermifugacao", "Transferencia", "Cobricao", "Outro", "Brinco"];
let tipoSelecionado = tiposServico[0];

function onTipoServicoSelecionado(tipo) {
    tipoSelecionado = tipo;
    renderTiposServico();
    renderizarCamposMovimentacao(tipoSelecionado);
    const hidden = document.getElementById('tipo-servico-hidden');
    if (hidden) hidden.value = tipoSelecionado;
}

function renderTiposServico() {
    const container = document.getElementById('tipos-servico-container');
    if (!container) return;
    container.querySelectorAll('.tipo-servico-card').forEach(e => e.remove());
    tiposServico.forEach(tipo => {
        const card = document.createElement('div');
        card.className = 'tipo-servico-card' + (tipo === tipoSelecionado ? ' selected' : '');
        card.textContent = tipo;
        card.onclick = () => onTipoServicoSelecionado(tipo);
        container.insertBefore(card, document.getElementById('btn-adicionar-tipo'));
    });
}

function renderizarCamposMovimentacao(tipo) {
    const container = document.getElementById('movimentacao-dinamica');
    container.innerHTML = '';
    const campos = camposPorTipo[tipo] || [];
    campos.forEach(campo => {
        const div = document.createElement('div');
        div.className = 'form-row';
        const label = document.createElement('label');
        label.htmlFor = campo.id;
        label.textContent = campo.label + (campo.required ? ' *' : '');
        const input = document.createElement('input');
        input.type = campo.type;
        input.id = campo.id;
        input.name = campo.id;
        if (campo.step) input.step = campo.step;
        if (campo.required) input.required = true;
        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    renderTiposServico();
    renderizarCamposMovimentacao(tipoSelecionado);
    // Botão para mostrar formulário de novo tipo
    const btnAdd = document.getElementById('btn-adicionar-tipo');
    if (btnAdd) {
        btnAdd.onclick = function () {
            document.getElementById('novo-tipo-form').style.display = 'flex';
            document.getElementById('novo-tipo-input').focus();
        };
    }
    // Botão para salvar novo tipo
    const btnSalvar = document.getElementById('salvar-novo-tipo');
    if (btnSalvar) {
        btnSalvar.onclick = function () {
            const novoTipo = document.getElementById('novo-tipo-input').value.trim();
            if (novoTipo && !tiposServico.includes(novoTipo)) {
                tiposServico.push(novoTipo);
                tipoSelecionado = novoTipo;
                renderTiposServico();
                document.getElementById('novo-tipo-input').value = '';
                document.getElementById('novo-tipo-form').style.display = 'none';
                // Atualiza input oculto se existir
                const hidden = document.getElementById('tipo-servico-hidden');
                if (hidden) hidden.value = tipoSelecionado;
            }
        };
    }
    // Enter no input adiciona também
    const inputNovo = document.getElementById('novo-tipo-input');
    if (inputNovo) {
        inputNovo.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                document.getElementById('salvar-novo-tipo').click();
            }
        });
    }
    // Se quiser manter o valor selecionado para envio, crie um input hidden:
    let hidden = document.getElementById('tipo-servico-hidden');
    if (!hidden) {
        hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.id = 'tipo-servico-hidden';
        hidden.name = 'tipo-servico';
        hidden.value = tipoSelecionado;
        document.getElementById('animal-form')?.appendChild(hidden);
    }
});

// No final do DOMContentLoaded, adicione:
document.getElementById('card-total-animais').addEventListener('click', () => {
    // Foca no primeiro campo do formulário para adicionar novo
    document.getElementById('serie').focus();
    // Rola a página até o formulário
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('card-ultimo-animal').addEventListener('click', () => {
    if (animais.length > 0) {
        // Edita o último animal cadastrado
        editarAnimal(animais.length - 1);
    } else {
        alert('Nenhum animal cadastrado ainda.');
    }
});

window.editarAnimal = function (index) {
    const animal = animais[index];

    // Preenche o formulário com os dados do animal
    document.getElementById('serie').value = animal.serie;
    document.getElementById('rg').value = animal.rg;
    document.getElementById('sexo').value = animal.sexo;
    document.getElementById('raca').value = animal.raca;
    document.getElementById('custo').value = animal.custo;
    document.getElementById('valor-venda').value = animal.venda;
    document.getElementById('nascimento').value = animal.nascimento || '';
    document.getElementById('meses').value = animal.meses || '';

    // Preenche a movimentação se existir
    if (animal.movimentacao && animal.movimentacao.tipo) {
        tipoSelecionado = animal.movimentacao.tipo;
        renderTiposServico();
        renderizarCamposMovimentacao(tipoSelecionado);

        // Preenche os campos dinâmicos
        const campos = camposPorTipo[tipoSelecionado] || [];
        campos.forEach(campo => {
            const input = document.getElementById(campo.id);
            if (input && animal.movimentacao[campo.id]) {
                input.value = animal.movimentacao[campo.id];
            }
        });
    }

    // Rola até o formulário
    document.getElementById('form-section').scrollIntoView({ behavior: 'smooth' });

    // Atualiza o submit para editar em vez de adicionar novo
    const form = document.getElementById('animal-form');
    form.onsubmit = function(e) {
        e.preventDefault();

        if (!validarFormulario()) return;

        // Atualiza o animal existente
        animais[index] = {
            serie: validadores.serie.formatar(document.getElementById("serie").value),
            rg: validadores.rg.formatar(document.getElementById("rg").value),
            sexo: validadores.sexo.formatar(document.getElementById("sexo").value),
            raca: validadores.raca.formatar(document.getElementById("raca").value),
            custo: document.getElementById("custo").value || 0,
            venda: validadores.valorVenda.formatar(document.getElementById("valor-venda").value),
            nascimento: document.getElementById("nascimento").value,
            meses: document.getElementById("meses").value,
            movimentacao: getMovimentacaoFromForm()
        };

        salvarNoStorage();
        renderizarTabela();
        form.reset();
        movDinamicaEl.innerHTML = '';

        // Restaura o submit original para adicionar novos
        form.onsubmit = submitOriginal;
    };

    // Guarda a função original de submit
    const submitOriginal = form.onsubmit;
};

function getMovimentacaoFromForm() {
    const tipoServico = tipoSelecionado;
    let movimentacao = { tipo: tipoServico };
    const camposMov = camposPorTipo[tipoServico] || [];

    camposMov.forEach(campo => {
        movimentacao[campo.id] = document.getElementById(campo.id)?.value || '';
    });

    return movimentacao;
}

function validarFormulario() {
    const campos = ['serie', 'rg', 'sexo', 'raca'];
    let todosValidos = true;

    campos.forEach(campo => {
        const tipo = campo === 'valor-venda' ? 'valorVenda' : campo;
        if (!aplicarValidacao(campo, tipo)) {
            todosValidos = false;
        }
    });

    return todosValidos;
}

// Substitua o form.addEventListener("submit", (e) => { ... }) por:
form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (!validarFormulario()) {
        alert('Por favor, corrija os erros antes de salvar.');
        return;
    }

    const novoAnimal = {
        serie: validadores.serie.formatar(document.getElementById("serie").value),
        rg: validadores.rg.formatar(document.getElementById("rg").value),
        sexo: validadores.sexo.formatar(document.getElementById("sexo").value),
        raca: validadores.raca.formatar(document.getElementById("raca").value),
        custo: document.getElementById("custo").value || 0,
        venda: validadores.valorVenda.formatar(document.getElementById("valor-venda").value),
        nascimento: document.getElementById("nascimento").value,
        meses: document.getElementById("meses").value,
        movimentacao: getMovimentacaoFromForm()
    };

    animais.push(novoAnimal);
    salvarNoStorage();
    renderizarTabela();
    form.reset();
    movDinamicaEl.innerHTML = '';

    // Limpar classes de validação
    ['serie', 'rg', 'sexo', 'raca'].forEach(campo => {
        document.getElementById(campo).classList.remove('erro', 'sucesso');
        removerMensagemErro(document.getElementById(campo));
    });

    // Resetar seleção do tipo de serviço
    tipoSelecionado = tiposServico[0];
    renderTiposServico();
    renderizarCamposMovimentacao(tipoSelecionado);
    const hidden = document.getElementById('tipo-servico-hidden');
    if (hidden) hidden.value = tipoSelecionado;
});

form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Validar todos os campos obrigatórios
    const campos = ['serie', 'rg', 'sexo', 'raca']; // valor-venda não é obrigatório
    let todosValidos = true;

    campos.forEach(campo => {
        const tipo = campo === 'valor-venda' ? 'valorVenda' : campo;
        if (!aplicarValidacao(campo, tipo)) {
            todosValidos = false;
        }
    });

    if (!todosValidos) {
        alert('Por favor, corrija os erros antes de salvar.');
        return;
    }

    // Movimentação dinâmica
    const tipoServico = tipoSelecionado; // ou document.getElementById('tipo-servico-hidden').value
    let movimentacao = { tipo: tipoServico };
    const camposMov = camposPorTipo[tipoServico] || [];
    camposMov.forEach(campo => {
        movimentacao[campo.id] = document.getElementById(campo.id)?.value || '';
    });

    // Cálculo do custo total
    let custo = document.getElementById("custo").value || 0;
    if (tipoServico === 'Brinco') {
        const valorBrinco = parseFloat(document.getElementById('mov-brinco-valor')?.value) || 0;
        custo = (parseFloat(custo) || 0) + valorBrinco;
    }

    const novoAnimal = {
        serie: validadores.serie.formatar(document.getElementById("serie").value),
        rg: validadores.rg.formatar(document.getElementById("rg").value),
        sexo: validadores.sexo.formatar(document.getElementById("sexo").value),
        raca: validadores.raca.formatar(document.getElementById("raca").value),
        custo: custo,
        venda: validadores.valorVenda.formatar(document.getElementById("valor-venda").value),
        nascimento: document.getElementById("nascimento").value,
        meses: document.getElementById("meses").value,
        movimentacao
    };

    animais.push(novoAnimal);
    salvarNoStorage();
    renderizarTabela();
    form.reset();
    movDinamicaEl.innerHTML = '';
    // Limpar classes de validação
    campos.forEach(campo => {
        document.getElementById(campo).classList.remove('erro', 'sucesso');
        removerMensagemErro(document.getElementById(campo));
    });
    // Resetar seleção do tipo de serviço para o primeiro
    tipoSelecionado = tiposServico[0];
    renderTiposServico();
    renderizarCamposMovimentacao(tipoSelecionado);
    const hidden = document.getElementById('tipo-servico-hidden');
    if (hidden) hidden.value = tipoSelecionado;
});
