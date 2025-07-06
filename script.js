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

    function renderizarCamposMovimentacao(tipo) {
        let html = '';
        if (tipo === 'Peso') {
            html = `<div class="mov-row">
                <label for="mov-peso-data">Data*:</label>
                <input type="date" id="mov-peso-data" required>
                <label for="mov-peso-valor">Peso (kg):</label>
                <input type="number" id="mov-peso-valor" step="0.01">
            </div>`;
        } else if (tipo === 'DG') {
            // Carregar veterinários cadastrados
            let vets = JSON.parse(localStorage.getItem('veterinarios') || '[]');
            let options = vets.map(v => `<option value="${v}">${v}</option>`).join('');
            html = `<div class="mov-row">
                <label for="mov-dg-data">Data*:</label>
                <input type="date" id="mov-dg-data" required>
                <label for="mov-dg-vet">Veterinário:</label>
                <select id="mov-dg-vet-select" style="width:130px; margin-right:0.5rem;">
                    <option value="">Escolha</option>
                    ${options}
                </select>
                <input type="text" id="mov-dg-vet" placeholder="Nome do veterinário" style="width:120px;">
                <a href="veterinario.html" class="button" style="padding:0.3rem 0.7rem; font-size:0.95rem; margin-left:0.5rem;">Adicionar Veterinário</a>
                <label for="mov-dg-resultado">Resultado:</label>
                <input type="text" id="mov-dg-resultado" placeholder="Resultado">
            </div>`;
        } else if (tipo === 'Exame') {
            html = `<div class="mov-row">
                <label for="mov-exame-data">Data*:</label>
                <input type="date" id="mov-exame-data" required>
                <label for="mov-exame-tipo">Exame:</label>
                <input type="text" id="mov-exame-tipo" placeholder="Tipo de exame">
                <label for="mov-exame-valor">Valor (R$):</label>
                <input type="number" id="mov-exame-valor" step="0.01">
            </div>`;
        } else if (tipo === 'Saida') {
            html = `<div class="mov-row">
                <label for="mov-saida-data">Data Saída*:</label>
                <input type="date" id="mov-saida-data" required>
                <label for="mov-saida-destino">Destino:</label>
                <input type="text" id="mov-saida-destino" placeholder="Destino">
                <label for="mov-saida-valor">Valor (R$):</label>
                <input type="number" id="mov-saida-valor" step="0.01">
            </div>`;
        } else if (tipo === 'Entrada') {
            html = `<div class="mov-row">
                <label for="mov-entrada-data">Data*:</label>
                <input type="date" id="mov-entrada-data" required>
                <label for="mov-entrada-origem">De onde veio:</label>
                <input type="text" id="mov-entrada-origem" placeholder="Origem">
                <label for="mov-entrada-fornecedor">Fornecedor:</label>
                <input type="text" id="mov-entrada-fornecedor" placeholder="Fornecedor">
            </div>`;
        } else if (tipo === 'Vacina') {
            html = `<div class="mov-row">
                <label for="mov-vacina-data">Data*:</label>
                <input type="date" id="mov-vacina-data" required>
                <label for="mov-vacina-tipo">Tipo de Vacina:</label>
                <input type="text" id="mov-vacina-tipo" placeholder="Vacina">
                <label for="mov-vacina-lote">Lote:</label>
                <input type="text" id="mov-vacina-lote" placeholder="Lote">
                <label for="mov-vacina-resp">Responsável:</label>
                <input type="text" id="mov-vacina-resp" placeholder="Responsável">
            </div>`;
        } else if (tipo === 'Vermifugacao') {
            html = `<div class="mov-row">
                <label for="mov-vermifugacao-data">Data*:</label>
                <input type="date" id="mov-vermifugacao-data" required>
                <label for="mov-vermifugacao-produto">Produto:</label>
                <input type="text" id="mov-vermifugacao-produto" placeholder="Produto">
                <label for="mov-vermifugacao-dose">Dose:</label>
                <input type="text" id="mov-vermifugacao-dose" placeholder="Dose">
                <label for="mov-vermifugacao-resp">Responsável:</label>
                <input type="text" id="mov-vermifugacao-resp" placeholder="Responsável">
            </div>`;
        } else if (tipo === 'Transferencia') {
            html = `<div class="mov-row">
                <label for="mov-transferencia-data">Data*:</label>
                <input type="date" id="mov-transferencia-data" required>
                <label for="mov-transferencia-origem">Origem:</label>
                <input type="text" id="mov-transferencia-origem" placeholder="Origem">
                <label for="mov-transferencia-destino">Destino:</label>
                <input type="text" id="mov-transferencia-destino" placeholder="Destino">
                <label for="mov-transferencia-motivo">Motivo:</label>
                <input type="text" id="mov-transferencia-motivo" placeholder="Motivo">
            </div>`;
        } else if (tipo === 'Cobricao') {
            html = `<div class="mov-row">
                <label for="mov-cobricao-data">Data*:</label>
                <input type="date" id="mov-cobricao-data" required>
                <label for="mov-cobricao-touro">Touro:</label>
                <input type="text" id="mov-cobricao-touro" placeholder="Touro">
                <label for="mov-cobricao-resultado">Resultado:</label>
                <input type="text" id="mov-cobricao-resultado" placeholder="Resultado">
            </div>`;
        } else if (tipo === 'Outro') {
            html = `<div class="mov-row">
                <label for="mov-outro-data">Data*:</label>
                <input type="date" id="mov-outro-data" required>
                <label for="mov-outro-tipo">Tipo de Serviço:</label>
                <input type="text" id="mov-outro-tipo" placeholder="Descreva o serviço">
                <label for="mov-outro-desc">Descrição:</label>
                <input type="text" id="mov-outro-desc" placeholder="Detalhes/Observação">
            </div>`;
        } else if (tipo === 'Brinco') {
            html = `<div class="mov-row">
                <label for="mov-brinco-data">Data*:</label>
                <input type="date" id="mov-brinco-data" required>
                <label for="mov-brinco-valor">Valor (R$)*:</label>
                <input type="number" id="mov-brinco-valor" step="0.01" required>
            </div>`;
        }
        movDinamicaEl.innerHTML = html;
        // Preencher veterinário se veio da página de cadastro
        if (tipo === 'DG' && localStorage.getItem('vet_nome_temp')) {
            document.getElementById('mov-dg-vet').value = localStorage.getItem('vet_nome_temp');
            localStorage.removeItem('vet_nome_temp');
        }
        // Ao escolher no select, preenche o campo texto
        const vetSelect = document.getElementById('mov-dg-vet-select');
        const vetInput = document.getElementById('mov-dg-vet');
        vetSelect.addEventListener('change', function () {
            vetInput.value = this.value;
        });
    }

    tipoServicoEl.addEventListener('change', (e) => {
        renderizarCamposMovimentacao(e.target.value);
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
        const tipoServico = tipoServicoEl.value;
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
        } else if (tipoServico === 'Brinco') {
            movimentacao.data = document.getElementById('mov-brinco-data').value;
            movimentacao.valor = document.getElementById('mov-brinco-valor').value;
        }

        // Cálculo do custo total
        let custo = document.getElementById("custo").value || 0;
        if (tipoServico === 'Brinco') {
            const valorBrinco = parseFloat(document.getElementById('mov-brinco-valor').value) || 0;
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
        tipoServicoEl.value = '';
        // Limpar classes de validação
        campos.forEach(campo => {
            document.getElementById(campo).classList.remove('erro', 'sucesso');
            removerMensagemErro(document.getElementById(campo));
        });
    });

    // Calcular meses automaticamente ao preencher nascimento
    document.getElementById('nascimento').addEventListener('change', function () {
        const nascimento = this.value;
        const mesesInput = document.getElementById('meses');
        if (nascimento) {
            const nascDate = new Date(nascimento);
            const hoje = new Date();
            let anos = hoje.getFullYear() - nascDate.getFullYear();
            let meses = hoje.getMonth() - nascDate.getMonth();
            if (meses < 0) {
                anos--;
                meses += 12;
            }
            let totalMeses = anos * 12 + meses;
            if (hoje.getDate() < nascDate.getDate()) {
                totalMeses--;
            }
            mesesInput.value = totalMeses >= 0 ? totalMeses : 0;
        } else {
            mesesInput.value = '';
        }
    });

    // Exibir foto do animal ao digitar a série
    const serieInput = document.getElementById('serie');
    const fotoContainer = document.getElementById('foto-animal-container');
    const fotoImg = document.getElementById('foto-animal');
    const fotoLabel = document.getElementById('foto-animal-label');
    const fotoErro = document.getElementById('foto-animal-erro');

    function atualizarFotoAnimal() {
        const serie = serieInput.value;
        if (serie.length > 0) {
            const fotoPath = `fotos/${serie}.jpg`;
            fotoImg.src = fotoPath;
            fotoImg.onload = function () {
                fotoContainer.style.display = 'block';
                fotoLabel.textContent = `Foto do animal série: ${serie}`;
                fotoErro.style.display = 'none';
            };
            fotoImg.onerror = function () {
                fotoContainer.style.display = 'block';
                fotoImg.src = '';
                fotoLabel.textContent = '';
                fotoErro.style.display = 'none';
            };
        } else {
            fotoContainer.style.display = 'none';
            fotoImg.src = '';
            fotoLabel.textContent = '';
            fotoErro.style.display = 'none';
        }
    }
    serieInput.addEventListener('input', atualizarFotoAnimal);
    serieInput.addEventListener('blur', atualizarFotoAnimal);
    serieInput.addEventListener('change', atualizarFotoAnimal);

    // Selecionar raça automaticamente conforme prefixo da série
    serieInput.addEventListener('input', function () {
        const serie = this.value.toUpperCase();
        if (serie.startsWith('CJCJ')) {
            document.getElementById('raca').value = 'Nelore';
        } else if (serie.startsWith('BENT')) {
            document.getElementById('raca').value = 'Brahman';
        } else if (serie.startsWith('CJCG')) {
            document.getElementById('raca').value = 'Gir';
        } else if (serie.startsWith('Recep'.toUpperCase())) {
            document.getElementById('raca').value = 'Receptoras';
            document.getElementById('sexo').value = 'Fêmea';
            document.getElementById('nascimento').value = '';
            document.getElementById('meses').value = 25;
        }
    });

    // Importação e exportação Excel/CSV
    const btnImportar = document.getElementById('btn-importar');
    const btnExportar = document.getElementById('btn-exportar');
    const inputImportar = document.getElementById('importar-excel');

    btnImportar.addEventListener('click', () => {
        inputImportar.value = '';
        inputImportar.click();
    });

    inputImportar.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
            // Espera colunas: serie, rg, sexo, raca, nascimento, meses, custo, venda, movimentacao (opcional)
            json.forEach(row => {
                // Adaptação para campos obrigatórios
                if (row.serie && row.rg) {
                    animais.push({
                        serie: row.serie,
                        rg: row.rg,
                        sexo: row.sexo || '',
                        raca: row.raca || '',
                        nascimento: row.nascimento || '',
                        meses: row.meses || '',
                        custo: row.custo || 0,
                        venda: row.venda || 0,
                        movimentacao: row.movimentacao || {}
                    });
                }
            });
            salvarNoStorage();
            renderizarTabela();
            alert('Importação concluída!');
        };
        reader.readAsArrayBuffer(file);
    });

    btnExportar.addEventListener('click', () => {
        // Exportar todos os animais para Excel
        const exportar = animais.map(animal => ({
            serie: animal.serie,
            rg: animal.rg,
            sexo: animal.sexo,
            raca: animal.raca,
            nascimento: animal.nascimento,
            meses: animal.meses,
            custo: animal.custo,
            venda: animal.venda,
            movimentacao: JSON.stringify(animal.movimentacao || {})
        }));
        const ws = XLSX.utils.json_to_sheet(exportar);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Animais');
        XLSX.writeFile(wb, 'animais.xlsx');
    });

    // Preencher valor de venda automaticamente ao cadastrar saída
    document.getElementById('tipo-servico').addEventListener('change', function () {
        if (this.value === 'Saida') {
            // Quando o campo de valor da saída for preenchido, atualizar valor-venda
            setTimeout(() => {
                const saidaValorInput = document.getElementById('mov-saida-valor');
                if (saidaValorInput) {
                    saidaValorInput.addEventListener('input', function () {
                        document.getElementById('valor-venda').value = this.value;
                    });
                }
            }, 100); // aguarda renderização dos campos dinâmicos
        } else {
            document.getElementById('valor-venda').value = '';
        }
    });

    const rgInput = document.getElementById('rg');

    function atualizarFotoAnimalPorRG() {
        const rg = rgInput.value;
        if (rg.length > 0) {
            const fotoPath = `fotos/${rg}.jpg`;
            fotoImg.src = fotoPath;
            fotoImg.onload = function () {
                fotoContainer.style.display = 'block';
                fotoLabel.textContent = `Foto do animal RG: ${rg}`;
                fotoErro.style.display = 'none';
            };
            fotoImg.onerror = function () {
                fotoContainer.style.display = 'block';
                fotoImg.src = '';
                fotoLabel.textContent = '';
                fotoErro.style.display = 'none';
            };
        } else {
            fotoContainer.style.display = 'none';
            fotoImg.src = '';
            fotoLabel.textContent = '';
            fotoErro.style.display = 'none';
        }
    }

    rgInput.addEventListener('input', atualizarFotoAnimalPorRG);
    rgInput.addEventListener('blur', atualizarFotoAnimalPorRG);
    rgInput.addEventListener('change', atualizarFotoAnimalPorRG);

    // Bloquear caracteres não permitidos em RG (apenas 1 a 6 números)
    rgInput.addEventListener('input', function (e) {
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
